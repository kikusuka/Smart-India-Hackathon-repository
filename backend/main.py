import base64
import binascii
import hashlib
import hmac
import json
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Any

import bcrypt
import psycopg2
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

try:
    import qrcode
except ImportError:  # pragma: no cover
    qrcode = None

DATABASE_URL = os.getenv("DATABASE_URL")
# A signed opaque bearer token keeps this prototype stateless; set SESSION_SECRET
# in production so restarting the process does not invalidate active sessions.
SESSION_SECRET = os.getenv("SESSION_SECRET") or secrets.token_urlsafe(32)
SESSION_TTL = timedelta(days=7)
bearer_scheme = HTTPBearer(auto_error=False)
OUTBREAK_WINDOW_HOURS = 72
OUTBREAK_THRESHOLD = 5
DIAGNOSIS_CATEGORIES = ("fever", "cough", "injury", "rash", "diarrhea", "other")

app = FastAPI(title="Rural Health Platform API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class DiagnosisRequest(BaseModel):
    doctor_name: str
    diagnosis_text: str
    diagnosis_category: str
    treatment_text: str
    medicine_prescribed: str
    dosage: str
    diagnosis_date: str
    region: str
    language: str
    doctor_id: str
    follow_up_date: str | None = None
    follow_up_type: str | None = Field(default=None, max_length=200)
    checklist_data: dict[str, bool] = Field(default_factory=dict)


class BatchItem(BaseModel):
    id: str
    doctor_name: str
    diagnosis_text: str
    diagnosis_category: str
    treatment_text: str
    region: str
    language: str
    offline_created_at: str


class BatchRequest(BaseModel):
    batch: list[BatchItem]


class DoctorSignupRequest(BaseModel):
    doctor_id: str = Field(min_length=1, max_length=120)
    doctor_name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1, max_length=128)
    region: str = Field(min_length=1, max_length=200)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return value


class DoctorLoginRequest(BaseModel):
    doctor_id: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=128)


class SyncPullRequest(BaseModel):
    patient_qr_id: str = Field(min_length=1, max_length=200)
    since_sequence: int = Field(default=0, ge=0)


class SyncPushRequest(BaseModel):
    patient_qr_id: str = Field(min_length=1, max_length=200)
    diagnosis_category: str = Field(min_length=1, max_length=120)
    diagnosis_text: str = Field(min_length=1)
    treatment_text: str = Field(min_length=1)
    medicine: str = ""
    dosage: str = ""
    region: str = Field(min_length=1, max_length=200)
    created_at: str | None = None
    client_entry_id: str | None = Field(default=None, max_length=200)
    follow_up_date: str | None = None
    follow_up_type: str | None = Field(default=None, max_length=200)
    checklist_data: dict[str, bool] = Field(default_factory=dict)


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)


def init_db() -> None:
    statements = [
        """CREATE TABLE IF NOT EXISTS diagnoses (
            id UUID PRIMARY KEY, patient_qr_id UUID NOT NULL, doctor_name TEXT NOT NULL,
            diagnosis_text TEXT NOT NULL, diagnosis_category TEXT NOT NULL,
            treatment_text TEXT NOT NULL, medicine_prescribed TEXT NOT NULL,
            dosage TEXT NOT NULL, diagnosis_date TIMESTAMPTZ NOT NULL, region TEXT NOT NULL,
            language TEXT NOT NULL, doctor_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())""",
        """CREATE TABLE IF NOT EXISTS patient_annotations (
            id UUID PRIMARY KEY, patient_qr_id UUID NOT NULL, date TIMESTAMPTZ NOT NULL,
            text TEXT NOT NULL, type TEXT NOT NULL)""",
        """CREATE TABLE IF NOT EXISTS surveillance_data (
            id UUID PRIMARY KEY, region TEXT NOT NULL, diagnosis_category TEXT NOT NULL,
            cases_7_days INTEGER NOT NULL DEFAULT 0, cases_30_days INTEGER NOT NULL DEFAULT 0,
            trend TEXT NOT NULL, trend_percentage TEXT NOT NULL, alert TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())""",
        """CREATE TABLE IF NOT EXISTS progression_patterns (
            pattern_key TEXT PRIMARY KEY, display_name TEXT NOT NULL, alert TEXT NOT NULL,
            risk_level TEXT NOT NULL, predicted_outcome TEXT NOT NULL, recommended_action TEXT NOT NULL)""",
        """CREATE TABLE IF NOT EXISTS doctors (
            id BIGSERIAL PRIMARY KEY, doctor_id TEXT NOT NULL UNIQUE, doctor_name TEXT NOT NULL,
            password_hash TEXT NOT NULL, region TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())""",
        """CREATE TABLE IF NOT EXISTS doctor_stats (
            doctor_id TEXT PRIMARY KEY REFERENCES doctors(doctor_id), doctor_name TEXT NOT NULL,
            total_diagnoses INTEGER NOT NULL DEFAULT 0, confirmed_accurate INTEGER NOT NULL DEFAULT 0,
            accuracy_score DOUBLE PRECISION, last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW())""",
        """CREATE TABLE IF NOT EXISTS patients (
            id BIGSERIAL PRIMARY KEY, patient_qr_id TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())""",
        """CREATE TABLE IF NOT EXISTS diagnosis_entries (
            id UUID PRIMARY KEY, patient_qr_id TEXT NOT NULL REFERENCES patients(patient_qr_id),
            sequence_number INTEGER NOT NULL, doctor_id TEXT NOT NULL, doctor_name TEXT NOT NULL,
            diagnosis_category TEXT NOT NULL, diagnosis_text TEXT NOT NULL, treatment_text TEXT NOT NULL,
            medicine TEXT NOT NULL DEFAULT '', dosage TEXT NOT NULL DEFAULT '', region TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), client_entry_id TEXT UNIQUE,
            confirmed_at TIMESTAMPTZ, confirmed_by TEXT,
            follow_up_date DATE, follow_up_type TEXT,
            checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            UNIQUE (patient_qr_id, sequence_number))""",
    ]
    seeds = [
        ("respiratory_progression", "Respiratory progression", "Worsening cough and breathing difficulty observed", "medium", "Escalation to lower respiratory complication", "Monitor oxygen saturation and refer if symptoms worsen"),
        ("dengue_progression", "Dengue progression", "Fever clusters with dehydration risk detected", "high", "Potential dengue escalation within nearby cases", "Increase mosquito control and advise hydration and follow-up"),
        ("dehydration_spiral", "Dehydration spiral", "Repeated diarrheal symptoms with fluid loss risk", "high", "Rapid worsening dehydration possible", "Start oral rehydration and escalate if intake remains low"),
    ]
    with get_connection() as conn:
        with conn.cursor() as cur:
            for statement in statements:
                cur.execute(statement)
            cur.execute("ALTER TABLE doctor_stats ADD COLUMN IF NOT EXISTS confirmed_accurate INTEGER NOT NULL DEFAULT 0")
            cur.execute("ALTER TABLE doctor_stats ADD COLUMN IF NOT EXISTS accuracy_score DOUBLE PRECISION")
            cur.execute("ALTER TABLE doctor_stats ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()")
            cur.execute("ALTER TABLE diagnosis_entries ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ")
            cur.execute("ALTER TABLE diagnosis_entries ADD COLUMN IF NOT EXISTS confirmed_by TEXT")
            cur.execute("ALTER TABLE diagnosis_entries ADD COLUMN IF NOT EXISTS follow_up_date DATE")
            cur.execute("ALTER TABLE diagnosis_entries ADD COLUMN IF NOT EXISTS follow_up_type TEXT")
            cur.execute("ALTER TABLE diagnosis_entries ADD COLUMN IF NOT EXISTS checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb")
            cur.execute("""UPDATE doctor_stats SET accuracy_score =
                confirmed_accurate::DOUBLE PRECISION / NULLIF(total_diagnoses, 0)""")
            for row in seeds:
                cur.execute("""INSERT INTO progression_patterns
                    (pattern_key, display_name, alert, risk_level, predicted_outcome, recommended_action)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (pattern_key) DO NOTHING""", row)


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_dt(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def parse_request_dt(value: str, field_name: str) -> datetime:
    try:
        return parse_dt(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail=f"{field_name} must be a valid ISO 8601 datetime")


def make_qr_base64(patient_qr_id: str) -> str:
    if qrcode is None:
        return base64.b64encode(patient_qr_id.encode("utf-8")).decode("utf-8")
    qr = qrcode.QRCode(border=1, box_size=8)
    qr.add_data(patient_qr_id)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def fetch_one(query: str, params: tuple[Any, ...] = ()):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchone()


def fetch_all(query: str, params: tuple[Any, ...] = ()):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()


def password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def password_matches(password: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_session_token(doctor_id: str) -> str:
    expires_at = int((datetime.now(timezone.utc) + SESSION_TTL).timestamp())
    payload = base64.urlsafe_b64encode(json.dumps({"doctor_id": doctor_id, "exp": expires_at}, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).digest()
    return f"{payload}.{base64.urlsafe_b64encode(signature).decode().rstrip('=')}"


def require_doctor(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload_part, signature_part = credentials.credentials.split(".", 1)
        expected = hmac.new(SESSION_SECRET.encode(), payload_part.encode(), hashlib.sha256).digest()
        actual = base64.urlsafe_b64decode(signature_part + "=" * (-len(signature_part) % 4))
        if not hmac.compare_digest(expected, actual):
            raise ValueError("bad signature")
        payload = json.loads(base64.urlsafe_b64decode(payload_part + "=" * (-len(payload_part) % 4)))
        if int(payload["exp"]) <= int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("expired")
        doctor_id = str(payload["doctor_id"])
    except (ValueError, KeyError, TypeError, binascii.Error, json.JSONDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    if not fetch_one("SELECT doctor_id FROM doctors WHERE doctor_id = %s", (doctor_id,)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor session is no longer valid")
    return doctor_id


def insert_sequence_entry(cur, patient_qr_id: str, doctor_id: str, doctor_name: str, category: str, diagnosis_text: str, treatment_text: str, medicine: str, dosage: str, region: str, created_at: datetime, client_entry_id: str | None = None, follow_up_date: str | None = None, follow_up_type: str | None = None, checklist_data: dict[str, bool] | None = None):
    cur.execute("INSERT INTO patients (patient_qr_id) VALUES (%s) ON CONFLICT (patient_qr_id) DO NOTHING", (patient_qr_id,))
    cur.execute("SELECT id FROM patients WHERE patient_qr_id = %s FOR UPDATE", (patient_qr_id,))
    if client_entry_id:
        cur.execute("SELECT id, sequence_number FROM diagnosis_entries WHERE client_entry_id = %s", (client_entry_id,))
        existing = cur.fetchone()
        if existing:
            return existing[0], existing[1], False
    cur.execute("SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM diagnosis_entries WHERE patient_qr_id = %s", (patient_qr_id,))
    sequence_number = cur.fetchone()[0]
    entry_id = str(uuid.uuid4())
    follow_up_dt = datetime.strptime(follow_up_date, "%Y-%m-%d").date() if follow_up_date else None
    cur.execute("""INSERT INTO diagnosis_entries
        (id, patient_qr_id, sequence_number, doctor_id, doctor_name, diagnosis_category,
         diagnosis_text, treatment_text, medicine, dosage, region, created_at, client_entry_id,
         follow_up_date, follow_up_type, checklist_data)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (entry_id, patient_qr_id, sequence_number, doctor_id, doctor_name, category, diagnosis_text, treatment_text, medicine, dosage, region, created_at, client_entry_id, follow_up_dt, follow_up_type, json.dumps(checklist_data or {})))
    return entry_id, sequence_number, True


def increment_doctor_diagnoses(cur, doctor_id: str, doctor_name: str):
    cur.execute(
        """INSERT INTO doctor_stats
            (doctor_id, doctor_name, total_diagnoses, confirmed_accurate, accuracy_score, last_updated)
            VALUES (%s, %s, 1, 0, 0, NOW())
            ON CONFLICT (doctor_id) DO UPDATE SET
                doctor_name = EXCLUDED.doctor_name,
                total_diagnoses = doctor_stats.total_diagnoses + 1,
                accuracy_score = doctor_stats.confirmed_accurate::DOUBLE PRECISION /
                    NULLIF(doctor_stats.total_diagnoses + 1, 0),
                last_updated = NOW()""",
        (doctor_id, doctor_name),
    )


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/health")
def health():
    return {"success": True}


@app.post("/api/auth/doctor/signup")
def doctor_signup(payload: DoctorSignupRequest):
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("INSERT INTO doctors (doctor_id, doctor_name, password_hash, region) VALUES (%s, %s, %s, %s)", (payload.doctor_id, payload.doctor_name, password_hash(payload.password), payload.region))
            except psycopg2.errors.UniqueViolation:
                raise HTTPException(status_code=409, detail="This Doctor ID is already registered.")
    return {"success": True, "doctor_id": payload.doctor_id}


@app.post("/api/auth/doctor/login")
def doctor_login(payload: DoctorLoginRequest):
    row = fetch_one("SELECT doctor_id, doctor_name, password_hash FROM doctors WHERE doctor_id = %s", (payload.doctor_id,))
    if not row or not password_matches(payload.password, row[2]):
        raise HTTPException(status_code=401, detail="Invalid doctor ID or password")
    return {"success": True, "doctor_id": row[0], "doctor_name": row[1], "access_token": create_session_token(row[0]), "token_type": "bearer"}


@app.post("/api/sync/pull")
def sync_pull(payload: SyncPullRequest, doctor_id: str = Depends(require_doctor)):
    if not fetch_one("SELECT patient_qr_id FROM patients WHERE patient_qr_id = %s", (payload.patient_qr_id,)):
        return {"success": True, "patient_qr_id": payload.patient_qr_id, "entries": [], "max_sequence_number": 0}
    rows = fetch_all("""SELECT id, sequence_number, doctor_id, doctor_name, diagnosis_category, diagnosis_text,
        treatment_text, medicine, dosage, region, created_at, follow_up_date, follow_up_type, checklist_data FROM diagnosis_entries
        WHERE patient_qr_id = %s AND sequence_number > %s ORDER BY sequence_number ASC""", (payload.patient_qr_id, payload.since_sequence))
    max_row = fetch_one("SELECT COALESCE(MAX(sequence_number), 0) FROM diagnosis_entries WHERE patient_qr_id = %s", (payload.patient_qr_id,))
    entries = [{"id": str(row[0]), "sequence_number": row[1], "doctor_id": row[2], "doctor_name": row[3], "diagnosis_category": row[4], "diagnosis_text": row[5], "treatment_text": row[6], "medicine": row[7], "dosage": row[8], "region": row[9], "created_at": row[10].isoformat(), "follow_up_date": row[11].isoformat() if row[11] else None, "follow_up_type": row[12], "checklist_data": row[13] or {}} for row in rows]
    return {"success": True, "patient_qr_id": payload.patient_qr_id, "entries": entries, "max_sequence_number": int(max_row[0])}


@app.post("/api/sync/push")
def sync_push(payload: SyncPushRequest, doctor_id: str = Depends(require_doctor)):
    doctor = fetch_one("SELECT doctor_name FROM doctors WHERE doctor_id = %s", (doctor_id,))
    created_at = parse_request_dt(payload.created_at, "created_at") if payload.created_at else datetime.now(timezone.utc)
    if payload.follow_up_date:
        try:
            datetime.strptime(payload.follow_up_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=422, detail="follow_up_date must be in YYYY-MM-DD format")
    with get_connection() as conn:
        with conn.cursor() as cur:
            entry_id, sequence_number, inserted = insert_sequence_entry(cur, payload.patient_qr_id, doctor_id, doctor[0], payload.diagnosis_category, payload.diagnosis_text, payload.treatment_text, payload.medicine, payload.dosage, payload.region, created_at, payload.client_entry_id, payload.follow_up_date, payload.follow_up_type, payload.checklist_data)
            if inserted:
                increment_doctor_diagnoses(cur, doctor_id, doctor[0])
    return {"success": True, "patient_qr_id": payload.patient_qr_id, "entry_id": str(entry_id), "sequence_number": int(sequence_number)}


@app.post("/api/diagnosis/{entry_id}/confirm")
def confirm_diagnosis(entry_id: uuid.UUID, confirming_doctor_id: str = Depends(require_doctor)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""SELECT doctor_id, confirmed_at FROM diagnosis_entries
                WHERE id = %s FOR UPDATE""", (str(entry_id),))
            entry = cur.fetchone()
            if not entry:
                raise HTTPException(status_code=404, detail="Diagnosis entry not found")
            if entry[1] is None:
                cur.execute("""UPDATE diagnosis_entries
                    SET confirmed_at = NOW(), confirmed_by = %s WHERE id = %s""", (confirming_doctor_id, str(entry_id)))
                cur.execute("""UPDATE doctor_stats SET
                    confirmed_accurate = confirmed_accurate + 1,
                    accuracy_score = (confirmed_accurate + 1)::DOUBLE PRECISION /
                        NULLIF(total_diagnoses, 0), last_updated = NOW()
                    WHERE doctor_id = %s""", (entry[0],))
            cur.execute("SELECT accuracy_score FROM doctor_stats WHERE doctor_id = %s", (entry[0],))
            score = cur.fetchone()
    return {"success": True, "entry_id": str(entry_id), "confirmed_accurate": True, "accuracy_score": score[0] if score else None}


@app.get("/api/doctor/{doctor_id}/stats")
def get_doctor_stats(doctor_id: str, current_doctor_id: str = Depends(require_doctor)):
    if current_doctor_id != doctor_id:
        raise HTTPException(status_code=403, detail="Doctors can only view their own statistics")
    row = fetch_one("""SELECT d.doctor_id, d.doctor_name, COALESCE(s.total_diagnoses, 0),
        COALESCE(s.confirmed_accurate, 0), s.accuracy_score
        FROM doctors d LEFT JOIN doctor_stats s ON s.doctor_id = d.doctor_id
        WHERE d.doctor_id = %s""", (doctor_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"doctor_id": row[0], "doctor_name": row[1], "total_diagnoses": row[2], "confirmed_accurate": row[3], "accuracy_score": row[4]}


@app.get("/api/supervisor/adherence/{region}")
def supervisor_adherence(region: str, current_doctor_id: str = Depends(require_doctor)):
    rows = fetch_all("""SELECT e.id, e.patient_qr_id, e.follow_up_date, e.follow_up_type, e.doctor_name,
        EXISTS (
            SELECT 1 FROM diagnosis_entries later
            WHERE later.patient_qr_id = e.patient_qr_id
              AND later.created_at::DATE > e.follow_up_date
        ) AS completed
        FROM diagnosis_entries e
        WHERE e.region = %s AND e.follow_up_date IS NOT NULL
        ORDER BY e.follow_up_date ASC, e.created_at ASC""", (region,))
    completed_count = sum(1 for row in rows if row[5])
    today = datetime.now(timezone.utc).date()
    overdue = [
        {
            "entry_id": str(row[0]),
            "patient_qr_id": row[1],
            "follow_up_date": row[2].isoformat(),
            "follow_up_type": row[3],
            "doctor_name": row[4],
        }
        for row in rows
        if row[2] < today and not row[5]
    ]
    return {"total_scheduled": len(rows), "completed": completed_count, "overdue": overdue}


@app.post("/api/diagnosis")
def create_diagnosis(payload: DiagnosisRequest):
    patient_qr_id = str(uuid.uuid4())
    diagnosis_id = str(uuid.uuid4())
    diagnosis_dt = parse_request_dt(payload.diagnosis_date, "diagnosis_date")
    if payload.follow_up_date:
        try:
            datetime.strptime(payload.follow_up_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=422, detail="follow_up_date must be in YYYY-MM-DD format")
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""INSERT INTO diagnoses
                (id, patient_qr_id, doctor_name, doctor_id, diagnosis_text, diagnosis_category,
                 treatment_text, medicine_prescribed, dosage, diagnosis_date, region, language)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (diagnosis_id, patient_qr_id, payload.doctor_name, payload.doctor_id, payload.diagnosis_text, payload.diagnosis_category, payload.treatment_text, payload.medicine_prescribed, payload.dosage, diagnosis_dt, payload.region, payload.language))
            insert_sequence_entry(cur, patient_qr_id, payload.doctor_id, payload.doctor_name, payload.diagnosis_category, payload.diagnosis_text, payload.treatment_text, payload.medicine_prescribed, payload.dosage, payload.region, diagnosis_dt, diagnosis_id, payload.follow_up_date, payload.follow_up_type, payload.checklist_data)
            increment_doctor_diagnoses(cur, payload.doctor_id, payload.doctor_name)
    return {"success": True, "qr_data": {"patient_qr_id": patient_qr_id, "qr_code_base64": make_qr_base64(patient_qr_id)}}


@app.get("/api/patient/{qr_id}")
def get_patient(qr_id: str):
    diagnosis_rows = fetch_all("SELECT diagnosis_date, doctor_name, diagnosis_text, diagnosis_category, treatment_text, medicine_prescribed FROM diagnoses WHERE patient_qr_id = %s ORDER BY diagnosis_date ASC", (qr_id,))
    annotation_rows = fetch_all("SELECT date, text, type FROM patient_annotations WHERE patient_qr_id = %s ORDER BY date ASC", (qr_id,))
    progression_alerts = []
    for row in diagnosis_rows:
        pattern = fetch_one("SELECT alert, risk_level, predicted_outcome, recommended_action FROM progression_patterns WHERE pattern_key = %s", (f"{row[3]}_progression",))
        if pattern:
            progression_alerts.append({"alert": pattern[0], "risk_level": pattern[1], "predicted_outcome": pattern[2], "recommended_action": pattern[3]})
    return {"patient_qr_id": qr_id, "medical_history": [{"diagnosis_date": row[0].isoformat(), "doctor_name": row[1], "diagnosis_text": row[2], "diagnosis_category": row[3], "treatment_text": row[4], "medicine": row[5]} for row in diagnosis_rows], "annotations": [{"date": row[0].isoformat(), "text": row[1], "type": row[2]} for row in annotation_rows], "progression_alerts": progression_alerts}


@app.get("/api/surveillance/dashboard")
def get_surveillance_dashboard():
    region_rows = fetch_all("SELECT region, COUNT(*) AS case_count FROM diagnoses GROUP BY region ORDER BY case_count DESC, region ASC")
    regions = []
    for region, case_count in region_rows:
        top_diagnoses = fetch_all("SELECT diagnosis_category FROM diagnoses WHERE region = %s GROUP BY diagnosis_category ORDER BY COUNT(*) DESC, diagnosis_category ASC LIMIT 3", (region,))
        regions.append({"region": region, "case_count": int(case_count), "top_diagnoses": [row[0] for row in top_diagnoses], "alert_level": "red" if case_count >= 10 else "yellow" if case_count >= 3 else "green"})
    total_diagnoses = fetch_one("SELECT COUNT(*) FROM diagnoses")[0]
    return {"regions": regions, "national_stats": {"total_diagnoses": int(total_diagnoses), "outbreak_alerts": sum(1 for region in regions if region["alert_level"] == "red")}}


@app.get("/api/surveillance/outbreak-check/{region}")
def outbreak_check(region: str, threshold: int = Query(default=OUTBREAK_THRESHOLD, ge=1)):
    rows = fetch_all("""SELECT diagnosis_category, COUNT(*) AS case_count
        FROM diagnosis_entries
        WHERE region = %s AND created_at >= NOW() - (%s * INTERVAL '1 hour')
        GROUP BY diagnosis_category HAVING COUNT(*) > %s
        ORDER BY case_count DESC, diagnosis_category ASC""", (region, OUTBREAK_WINDOW_HOURS, threshold))
    counts = {diagnosis_category: int(case_count) for diagnosis_category, case_count in rows}
    alerts = []
    # This is a simple threshold-based heuristic for demonstration purposes, not a clinical epidemiological model.
    for diagnosis_category in DIAGNOSIS_CATEGORIES:
        case_count = counts.get(diagnosis_category, 0)
        if case_count <= threshold:
            continue
        severity = "critical" if case_count > threshold * 2 else "alert"
        alerts.append({
            "diagnosis_category": diagnosis_category,
            "case_count": int(case_count),
            "window_hours": OUTBREAK_WINDOW_HOURS,
            "threshold": threshold,
            "severity": severity,
            "message": f"{case_count} cases of {diagnosis_category} reported in {region} in the last {OUTBREAK_WINDOW_HOURS} hours",
        })
    return {"region": region, "alerts": alerts}


@app.get("/api/surveillance/{region}")
def get_surveillance(region: str):
    rows = fetch_all("SELECT diagnosis_category, COUNT(*) FROM diagnoses WHERE region = %s AND diagnosis_date >= NOW() - INTERVAL '30 days' GROUP BY diagnosis_category ORDER BY COUNT(*) DESC, diagnosis_category ASC", (region,))
    data = [{"diagnosis_category": category, "cases_7_days": int(fetch_one("SELECT COUNT(*) FROM diagnoses WHERE region = %s AND diagnosis_category = %s AND diagnosis_date >= NOW() - INTERVAL '7 days'", (region, category))[0]), "cases_30_days": int(count), "trend": "rising", "trend_percentage": "+12.3%", "alert": "monitor" if count < 5 else "alert"} for category, count in rows]
    return {"region": region, "data": data, "outbreak_prediction": {"alert": "elevated outbreak potential" if data else "no active outbreak signal", "confidence": 0.85 if data else 0.25, "estimated_peak_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(), "recommended_actions": ["Increase community screening", "Coordinate local health workers"]}, "timestamp": iso_now()}


@app.post("/api/sync/batch")
def sync_batch(payload: BatchRequest):
    synced_count = 0
    failed_count = 0
    with get_connection() as conn:
        with conn.cursor() as cur:
            for item in payload.batch:
                try:
                    patient_qr_id = str(uuid.uuid4())
                    cur.execute("""INSERT INTO diagnoses
                        (id, patient_qr_id, doctor_name, doctor_id, diagnosis_text, diagnosis_category,
                         treatment_text, medicine_prescribed, dosage, diagnosis_date, region, language)
                        VALUES (%s, %s, %s, '', %s, %s, %s, '', '', %s, %s, %s) ON CONFLICT (id) DO NOTHING""", (item.id, patient_qr_id, item.doctor_name, item.diagnosis_text, item.diagnosis_category, item.treatment_text, parse_dt(item.offline_created_at), item.region, item.language))
                    synced_count += 1
                except Exception:
                    failed_count += 1
    return {"success": True, "synced_count": synced_count, "failed_count": failed_count, "timestamp": iso_now()}
