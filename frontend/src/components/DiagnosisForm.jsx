import React, { useState } from 'react';
import QRCode from 'qrcode';
import { encodeHistoryToQR, createDiagnosisRecord, addDiagnosisToHistory } from '../services/localHistory';

const CATEGORIES = ['fever', 'cough', 'injury', 'rash', 'diarrhea', 'other'];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' }
];

export default function DiagnosisForm({ isOnline = true, existingHistory = [] }) {
  const [formData, setFormData] = useState({
    doctor_name: '',
    doctor_id: '',
    diagnosis_text: '',
    diagnosis_category: 'fever',
    treatment_text: '',
    medicine_prescribed: '',
    dosage: '',
    region: '',
    language: 'en'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQrImage(null);
    setSuccessMsg('');

    const newDiagnosis = createDiagnosisRecord(formData);
    const updatedHistory = addDiagnosisToHistory(existingHistory, newDiagnosis);

    try {
      const qrData = encodeHistoryToQR(updatedHistory);
      const imageDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'L',
        margin: 2,
        width: 384,
      });
      setQrImage(imageDataUrl);
      setSuccessMsg('Diagnosis added! Patient QR code generated below.');
    } catch (err) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">New Patient Diagnosis</h2>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-600">
            Offline-First Mode
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {qrImage && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Patient QR Code Generated</h3>
          <p className="text-sm text-blue-700 mb-4 text-center">
            This QR contains the complete medical history. Show/save it for the patient.
            <br />
            <span className="font-semibold text-blue-800">Nothing is sent to any server.</span>
          </p>
          <img src={qrImage} alt="Patient QR Code" className="w-48 h-48 bg-white p-2 border border-gray-300 rounded-md shadow-sm" />
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrImage;
              link.download = `patient_qr_${formData.doctor_name || 'record'}.png`;
              link.click();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
          >
            Download QR Code
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
            <input
              type="text"
              name="doctor_name"
              value={formData.doctor_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dr. Rajesh Kumar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID</label>
            <input
              type="text"
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DOC-9981"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Category</label>
            <select
              name="diagnosis_category"
              value={formData.diagnosis_category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rural Region A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Notes</label>
          <textarea
            name="diagnosis_text"
            value={formData.diagnosis_text}
            onChange={handleChange}
            required
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the patient's symptoms and diagnosis details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Description</label>
          <textarea
            name="treatment_text"
            value={formData.treatment_text}
            onChange={handleChange}
            required
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detail the prescribed therapy or care instructions..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Prescribed</label>
            <input
              type="text"
              name="medicine_prescribed"
              value={formData.medicine_prescribed}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paracetamol 500mg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage & Frequency</label>
            <input
              type="text"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1 tablet twice daily after meals"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-semibold text-white transition ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {loading ? 'Generating QR...' : 'Add Diagnosis & Generate QR'}
        </button>
      </form>
    </div>
  );
}
