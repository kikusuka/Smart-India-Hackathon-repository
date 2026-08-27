import React, { useState } from 'react';
import { confirmDiagnosis } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MedicalTimeline({ patientData }) {
  const { isAuthenticated } = useAuth();
  const [toast, setToast] = useState(null);
  if (!patientData) return null;

  const { patient_qr_id, medical_history = [], annotations = [], progression_alerts = [] } = patientData;

  // Sort medical history chronologically (latest first)
  const sortedHistory = [...medical_history].sort((a, b) => {
    return new Date(b.diagnosis_date) - new Date(a.diagnosis_date);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirm = async (entryId) => {
    try {
      await confirmDiagnosis(entryId);
      showToast('Diagnosis confirmation recorded');
    } catch (err) {
      showToast(err.message || 'Failed to confirm diagnosis', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            {toast.type === 'success' ? (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Patient Identification Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Patient Identification</h3>
          <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400 break-all bg-emerald-50 dark:bg-slate-700/50 px-3 py-1 rounded border border-emerald-100 dark:border-slate-600 inline-block">{patient_qr_id}</p>
        </div>
        <div className="hidden sm:block">
          <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
        </div>
      </div>

      {/* Progression Alerts (Highlighted in Red) */}
      {progression_alerts && progression_alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Critical Progression Alerts</h3>
              <div className="mt-3 space-y-4">
                {progression_alerts.map((alert, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-100 dark:border-red-800/50 shadow-sm">
                    <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2">{alert.alert}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-red-800 dark:text-red-300">
                      <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded">
                        <span className="block font-semibold opacity-80 mb-0.5">Risk Level</span>
                        <span className="uppercase font-extrabold">{alert.risk_level}</span>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded">
                        <span className="block font-semibold opacity-80 mb-0.5">Predicted Outcome</span>
                        {alert.predicted_outcome}
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded">
                        <span className="block font-semibold opacity-80 mb-0.5">Recommended Action</span>
                        {alert.recommended_action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 font-casual flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Medical History Timeline
        </h3>
        
        {sortedHistory.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No diagnostic history found for this patient.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-emerald-200 dark:border-emerald-800/50 ml-4 sm:ml-6 space-y-10 pb-4">
            {sortedHistory.map((item, index) => (
              <div key={index} className="relative pl-6 sm:pl-8">
                {/* Timeline dot */}
                <span className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-800"></span>
                
                {/* Event Card */}
                <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap justify-between items-start mb-4 gap-3 border-b border-slate-200 dark:border-slate-600 pb-4">
                    <div>
                      <span className="inline-block text-xs font-bold uppercase px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-md mb-2">
                        {item.diagnosis_category || 'Other'}
                      </span>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Diagnosed by: <span className="font-bold">{item.doctor_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm">
                        {formatDate(item.diagnosis_date)}
                      </span>
                      {/* Confirm Accurate Button - only show if item has an ID */}
                      {item.id && isAuthenticated && (
                        <button
                          onClick={() => handleConfirm(item.id)}
                          className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                          title="Confirm diagnosis as accurate"
                          aria-label="Confirm diagnosis as accurate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Diagnosis Details</h4>
                      <p className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 leading-relaxed">{item.diagnosis_text}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Treatment Plan</h4>
                        <p className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 h-full">{item.treatment_text}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Medication</h4>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 h-full flex flex-col justify-center">
                          <span className="font-bold text-gray-900 dark:text-white text-base">{item.medicine || item.medicine_prescribed || 'None'}</span>
                          {item.dosage && <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded mt-2 font-medium w-fit">Dosage: {item.dosage}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Annotations Section (Observations/Wisdom/Side Effects) */}
      {annotations && annotations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 font-casual flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
            Patient Annotations & Notes
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {annotations.map((note, index) => {
              const typeColors = {
                observation: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
                wisdom: 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
                side_effect: 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
                recovery: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
              };
              const colorClass = typeColors[note.type] || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

              return (
                <div key={index} className={`p-4 rounded-lg border ${colorClass} flex flex-col md:flex-row md:justify-between md:items-center gap-3 transition-colors`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-widest bg-white/50 dark:bg-black/20 px-2 py-1 rounded w-fit">{note.type}</span>
                    <span className="text-sm font-medium">{note.text}</span>
                  </div>
                  <span className="text-xs font-semibold opacity-70 whitespace-nowrap bg-white/50 dark:bg-black/20 px-2 py-1 rounded">{formatDate(note.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
