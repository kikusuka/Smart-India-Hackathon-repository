import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import ProgressionAlert from './ProgressionAlert';

export default function SurveillanceMap({ region }) {
  const [surveillanceData, setSurveillanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSurveillance(region);
        setSurveillanceData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch surveillance data');
      } finally {
        setLoading(false);
      }
    }

    if (region) {
      fetchData();
    }
  }, [region]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading surveillance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error: {error}
      </div>
    );
  }

  if (!surveillanceData) {
    return null;
  }

  const { data = [], outbreak_prediction, timestamp } = surveillanceData;

  // Transform data for line chart - comparing cases_7_days vs cases_30_days per diagnosis_category
  const chartData = data.map(item => ({
    name: item.diagnosis_category,
    cases_7_days: item.cases_7_days,
    cases_30_days: item.cases_30_days,
  }));

  return (
    <div className="space-y-6">
      {/* Outbreak Prediction Banner */}
      {outbreak_prediction && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-bold text-red-800">Outbreak Prediction Alert</h3>
              <p className="text-red-700">{outbreak_prediction.alert}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-red-800">Confidence:</span>{' '}
                  <span className="font-mono text-red-700">{(outbreak_prediction.confidence * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="font-semibold text-red-800">Estimated Peak Date:</span>{' '}
                  <span className="text-red-700">
                    {outbreak_prediction.estimated_peak_date 
                      ? new Date(outbreak_prediction.estimated_peak_date).toLocaleDateString() 
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-red-800">Risk Level:</span>{' '}
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    outbreak_prediction.confidence >= 0.8 ? 'bg-red-100 text-red-700' : 
                    outbreak_prediction.confidence >= 0.5 ? 'bg-orange-100 text-orange-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {outbreak_prediction.confidence >= 0.8 ? 'HIGH' : outbreak_prediction.confidence >= 0.5 ? 'MEDIUM' : 'LOW'}
                  </span>
                </div>
              </div>
              {outbreak_prediction.recommended_actions && outbreak_prediction.recommended_actions.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold text-red-800 mb-2">Recommended Actions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    {outbreak_prediction.recommended_actions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Line Chart - Cases Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Disease Surveillance: 7-Day vs 30-Day Cases
        </h3>
        {chartData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No surveillance data available for this region.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cases_7_days" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Cases (7 days)"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cases_30_days" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  name="Cases (30 days)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Surveillance Data</h3>
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No detailed data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">7-Day Cases</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">30-Day Cases</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.diagnosis_category}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.cases_7_days}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.cases_30_days}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                        item.trend === 'decreasing' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.trend}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.trend_percentage}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {item.alert ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          {item.alert}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {timestamp && (
          <p className="text-xs text-gray-400 mt-4 text-right">
            Last updated: {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
