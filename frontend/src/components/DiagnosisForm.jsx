import React, { useState } from 'react';
import QRCode from 'qrcode';
import InfoTooltip from './InfoTooltip';
import { useAuth } from '../context/AuthContext';
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
  const { doctorId, doctorName } = useAuth();
  const [formData, setFormData] = useState({
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

    const newDiagnosis = createDiagnosisRecord({
      ...formData,
      doctor_id: doctorId,
      doctor_name: doctorName || doctorId,
    });
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
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 transition-colors duration-300">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-slate-700 pb-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white font-casual">New Patient Diagnosis</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Offline-First
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
          <p className="font-medium">{error}</p>
        </div>
      )}

      {qrImage && (
        <div className="mb-10 p-8 bg-blue-50 dark:bg-slate-700/50 rounded-xl border border-blue-100 dark:border-slate-600 flex flex-col items-center justify-center text-center transition-colors">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">Patient QR Code Generated <InfoTooltip label="Explain patient QR code">This QR code contains your patient's full medical history, encoded and compressed. Nothing is sent to any server — scan it with any device running this app to view the history.</InfoTooltip></h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-6 max-w-sm">
            This QR contains the complete medical history. Show/save it for the patient.
            <span className="block mt-1 font-semibold text-blue-800 dark:text-blue-200">Nothing is sent to any server.</span>
          </p>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 inline-block">
            <img src={qrImage} alt="Patient QR Code" className="w-56 h-56" />
          </div>
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrImage;
              link.download = `patient_qr_${doctorName || doctorId || 'record'}.png`;
              link.click();
            }}
            className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow transition-all font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download QR Code
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section: Doctor Info */}
        <section className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Provider Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Doctor Name</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{doctorName || 'Authenticated doctor'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Doctor ID</p>
              <p className="mt-1 font-mono font-semibold text-gray-900 dark:text-white">{doctorId}</p>
            </div>
          </div>
        </section>

        {/* Section: Visit Details */}
        <section className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            Visit Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Category</label>
              <select
                name="diagnosis_category"
                value={formData.diagnosis_category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Region</label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm"
                placeholder="Rural Region A"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Diagnosis Notes</label>
              <textarea
                name="diagnosis_text"
                value={formData.diagnosis_text}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm resize-y"
                placeholder="Describe symptoms and findings..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Treatment Plan</label>
              <textarea
                name="treatment_text"
                value={formData.treatment_text}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm resize-y"
                placeholder="Detail the prescribed therapy..."
              />
            </div>
          </div>
        </section>

        {/* Section: Medication */}
        <section className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            Medication
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Prescribed Medicine</label>
              <input
                type="text"
                name="medicine_prescribed"
                value={formData.medicine_prescribed}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm"
                placeholder="Paracetamol 500mg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Dosage & Frequency</label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm"
                placeholder="1 tablet twice daily after meals"
              />
            </div>
          </div>
        </section>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 hover:shadow-lg dark:bg-emerald-500 dark:hover:bg-emerald-400'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </>
            ) : (
              'Add Diagnosis & Generate QR'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
