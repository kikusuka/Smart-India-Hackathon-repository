import React from 'react';

export default function ProgressionAlert({ alert, risk_level, predicted_outcome, recommended_action }) {
  const riskLevelColors = {
    low: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    medium: 'bg-amber-50 border-amber-200 text-amber-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  const riskBadgeColors = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  const colorClass = riskLevelColors[risk_level?.toLowerCase()] || 'bg-gray-50 border-gray-200 text-gray-800';
  const badgeColorClass = riskBadgeColors[risk_level?.toLowerCase()] || 'bg-gray-100 text-gray-700';

  return (
    <div className={`p-4 rounded-lg border-l-4 ${colorClass} shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          <p className="font-semibold">{alert}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="font-medium">Risk Level:</span>{' '}
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${badgeColorClass}`}>
                {risk_level}
              </span>
            </div>
            <div>
              <span className="font-medium">Predicted Outcome:</span> {predicted_outcome}
            </div>
            <div>
              <span className="font-medium">Recommended Action:</span> {recommended_action}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
