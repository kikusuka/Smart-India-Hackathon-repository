import React, { useEffect, useState } from 'react';

const mockRegions = [
  {
    region: 'North District',
    alert_level: 'red',
    case_count: 1247,
    top_diagnoses: ['fever', 'cough', 'diarrhea']
  },
  {
    region: 'South District',
    alert_level: 'yellow',
    case_count: 892,
    top_diagnoses: ['fever', 'injury', 'rash']
  },
  {
    region: 'East District',
    alert_level: 'green',
    case_count: 456,
    top_diagnoses: ['cough', 'fever']
  },
  {
    region: 'West District',
    alert_level: 'yellow',
    case_count: 723,
    top_diagnoses: ['diarrhea', 'fever', 'injury']
  },
  {
    region: 'Central District',
    alert_level: 'red',
    case_count: 1589,
    top_diagnoses: ['fever', 'cough', 'diarrhea', 'rash']
  },
  {
    region: 'Coastal Region',
    alert_level: 'green',
    case_count: 334,
    top_diagnoses: ['injury', 'rash']
  }
];

const mockNationalStats = {
  total_diagnoses: 5241,
  outbreak_alerts: 2
};

export default function SurveillanceDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      try {
        setLoading(true);
        setError(null);
        setDashboardData({
          regions: mockRegions,
          national_stats: mockNationalStats
        });
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <svg className="animate-spin h-10 w-10 text-blue-600 dark:text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-gray-500 dark:text-gray-400 font-medium">Loading surveillance dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { regions = [], national_stats = {} } = dashboardData;

  const getAlertColorClasses = (alertLevel) => {
    switch (alertLevel?.toLowerCase()) {
      case 'red':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 hover:border-red-400 dark:hover:border-red-500 border-l-red-500 dark:border-l-red-500';
      case 'yellow':
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50 hover:border-yellow-400 dark:hover:border-yellow-500 border-l-yellow-500 dark:border-l-yellow-500';
      case 'green':
        return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-500 border-l-emerald-500 dark:border-l-emerald-500';
      default:
        return 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 border-l-gray-500 dark:border-l-slate-500';
    }
  };

  const getAlertBadgeClasses = (alertLevel) => {
    switch (alertLevel?.toLowerCase()) {
      case 'red':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50';
      case 'yellow':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50';
      case 'green':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50';
      default:
        return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4 px-2 sm:px-4 transition-colors duration-300">
      {/* Demo Mode Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 flex items-center gap-4 shadow-sm transition-colors">
        <svg className="flex-shrink-0 h-8 w-8 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">Demo Mode — Mock Data</p>
          <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
            This surveillance dashboard uses hardcoded sample data for demonstration purposes.
            In production, this would connect to the backend API for real-time regional outbreak data.
          </p>
        </div>
      </div>

      {/* National Statistics Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 dark:from-slate-800 dark:to-slate-900 text-white p-8 rounded-2xl shadow-lg border border-blue-600 dark:border-slate-700 transition-colors">
        <h1 className="text-3xl font-extrabold mb-6 font-casual flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-300 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          National Health Surveillance
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-6 rounded-xl border border-white/10">
            <p className="text-blue-100 dark:text-slate-300 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Total Diagnoses
            </p>
            <p className="text-5xl font-black">{national_stats.total_diagnoses?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-6 rounded-xl border border-white/10">
            <p className="text-blue-100 dark:text-slate-300 text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Active Outbreak Alerts
            </p>
            <p className={`text-5xl font-black ${
              national_stats.outbreak_alerts > 0 ? 'text-red-300 dark:text-red-400' : 'text-emerald-300 dark:text-emerald-400'
            }`}>
              {national_stats.outbreak_alerts?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Region Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white font-casual">Regional Surveillance Status</h2>
        </div>
        
        {regions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 dark:border-slate-700 text-center transition-colors">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No regional data available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((regionItem, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-xl border border-l-8 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${getAlertColorClasses(regionItem.alert_level)}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{regionItem.region}</h3>
                  <span className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest ${getAlertBadgeClasses(regionItem.alert_level)}`}>
                    {regionItem.alert_level || 'Unknown'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/50 dark:bg-black/10 p-3 rounded-lg border border-black/5 dark:border-white/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Total Cases</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{regionItem.case_count?.toLocaleString() || '0'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Top Diagnoses</p>
                    {regionItem.top_diagnoses && regionItem.top_diagnoses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {regionItem.top_diagnoses.map((diagnosis, diagIdx) => (
                          <span
                            key={diagIdx}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-md text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 shadow-sm capitalize"
                          >
                            {diagnosis}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic font-medium">No data</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}