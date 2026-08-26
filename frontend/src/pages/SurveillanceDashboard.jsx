import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function SurveillanceDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSurveillanceDashboard();
        setDashboardData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500 text-lg">Loading surveillance dashboard...</div>
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
        return 'bg-red-50 border-red-200 hover:border-red-400';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 hover:border-yellow-400';
      case 'green':
        return 'bg-emerald-50 border-emerald-200 hover:border-emerald-400';
      default:
        return 'bg-gray-50 border-gray-200 hover:border-gray-400';
    }
  };

  const getAlertBadgeClasses = (alertLevel) => {
    switch (alertLevel?.toLowerCase()) {
      case 'red':
        return 'bg-red-100 text-red-700';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-700';
      case 'green':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* National Statistics Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">National Health Surveillance Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-blue-100 text-sm uppercase tracking-wider font-medium">Total Diagnoses</p>
            <p className="text-4xl font-extrabold mt-1">{national_stats.total_diagnoses?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-blue-100 text-sm uppercase tracking-wider font-medium">Active Outbreak Alerts</p>
            <p className={`text-4xl font-extrabold mt-1 ${
              national_stats.outbreak_alerts > 0 ? 'text-red-200' : 'text-emerald-200'
            }`}>
              {national_stats.outbreak_alerts?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Region Cards Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Regional Surveillance Status</h2>
        {regions.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
            <p className="text-gray-500">No regional data available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((regionItem, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg border-l-4 shadow-sm transition-all duration-200 ${getAlertColorClasses(regionItem.alert_level)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{regionItem.region}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getAlertBadgeClasses(regionItem.alert_level)}`}>
                    {regionItem.alert_level || 'Unknown'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Cases</p>
                    <p className="text-2xl font-bold text-gray-900">{regionItem.case_count?.toLocaleString() || '0'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Top Diagnoses</p>
                    {regionItem.top_diagnoses && regionItem.top_diagnoses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {regionItem.top_diagnoses.map((diagnosis, diagIdx) => (
                          <span
                            key={diagIdx}
                            className="px-2 py-1 bg-white/50 rounded text-xs font-medium text-gray-700 border border-gray-200"
                          >
                            {diagnosis}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No data</p>
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
