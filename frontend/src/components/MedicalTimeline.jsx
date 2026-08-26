import React from 'react';

export default function MedicalTimeline({ patientData }) {
  if (!patientData) return null;

  const { patient_qr_id, medical_history = [], annotations = [], progression_alerts = [] } = patientData;

  // Sort medical history chronologically (latest first or earliest first? Usually latest first makes reading easier, but let's sort latest first)
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Patient Identification Card */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Patient Identification</h3>
        <p className="font-mono text-sm text-gray-800 break-all">{patient_qr_id}</p>
      </div>

      {/* Progression Alerts (Highlighted in Red) */}
      {progression_alerts && progression_alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-md font-bold text-red-800">Critical Progression Alerts</h3>
              <div className="mt-2 space-y-3">
                {progression_alerts.map((alert, idx) => (
                  <div key={idx} className="border-b border-red-100 pb-2 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-red-900">{alert.alert}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1 text-xs text-red-700">
                      <div>
                        <span className="font-bold">Risk Level:</span>{' '}
                        <span className="uppercase font-extrabold">{alert.risk_level}</span>
                      </div>
                      <div>
                        <span className="font-bold">Predicted Outcome:</span> {alert.predicted_outcome}
                      </div>
                      <div>
                        <span className="font-bold">Recommended Action:</span> {alert.recommended_action}
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
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Medical History & Progression Timeline</h3>
        
        {sortedHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No diagnostic history found for this patient.</p>
        ) : (
          <div className="relative border-l-2 border-blue-200 ml-4 space-y-8 pb-4">
            {sortedHistory.map((item, index) => (
              <div key={index} className="relative pl-6">
                {/* Timeline dot */}
                <span className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                </span>
                
                {/* Event Card */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition">
                  <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {item.diagnosis_category || 'Other'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.diagnosis_date)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Diagnosed by: <span className="font-semibold text-gray-900">{item.doctor_name}</span>
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 text-sm text-gray-700">
                    <div>
                      <h4 className="font-semibold text-gray-800">Diagnosis Details</h4>
                      <p className="bg-white p-2 rounded border border-gray-100 mt-0.5">{item.diagnosis_text}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800">Treatment Plan</h4>
                        <p className="bg-white p-2 rounded border border-gray-100 mt-0.5">{item.treatment_text}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Medication</h4>
                        <p className="bg-white p-2 rounded border border-gray-100 mt-0.5">
                          <span className="font-bold text-gray-950">{item.medicine || item.medicine_prescribed || 'None'}</span>
                          {item.dosage && <span className="block text-xs text-gray-500 mt-0.5">Dosage: {item.dosage}</span>}
                        </p>
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
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Patient Annotations & Notes</h3>
          <div className="grid grid-cols-1 gap-3">
            {annotations.map((note, index) => {
              const typeColors = {
                observation: 'bg-blue-50 text-blue-700 border-blue-200',
                wisdom: 'bg-purple-50 text-purple-700 border-purple-200',
                side_effect: 'bg-amber-50 text-amber-700 border-amber-200',
                recovery: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              };
              const colorClass = typeColors[note.type] || 'bg-gray-50 text-gray-700 border-gray-200';

              return (
                <div key={index} className={`p-3 rounded-lg border ${colorClass} flex flex-col md:flex-row md:justify-between md:items-center gap-2`}>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider mr-2">{note.type}</span>
                    <span className="text-sm font-medium">{note.text}</span>
                  </div>
                  <span className="text-xs opacity-75">{formatDate(note.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
