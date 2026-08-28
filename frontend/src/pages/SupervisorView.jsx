import { useState } from 'react';
import InfoTooltip from '../components/InfoTooltip';
import { getSupervisorAdherence } from '../services/api';

export default function SupervisorView() {
  const [region, setRegion] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAdherence = async (event) => {
    event.preventDefault();
    if (!region.trim()) {
      setError('Enter a region to view follow-up adherence.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setData(await getSupervisorAdherence(region.trim()));
    } catch (requestError) {
      setError(requestError.message || 'Could not load adherence data.');
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = data?.total_scheduled
    ? Math.round((data.completed / data.total_scheduled) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4 px-2 sm:px-4">
      <div className="text-center">
        <h1 className="font-casual text-4xl font-extrabold text-gray-900 dark:text-white">Follow-up Adherence</h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-400">A lightweight view of scheduled follow-ups and later recorded visits.</p>
      </div>

      <form onSubmit={loadAdherence} className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <label htmlFor="supervisor-region" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Region</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="supervisor-region" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="North District" className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-500 disabled:opacity-60">{loading ? 'Loading...' : 'View adherence'}</button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">Completion is based on a later diagnosis entry for the same patient after the scheduled date. <InfoTooltip label="Explain adherence calculation">This view only summarizes scheduling and recorded follow-up activity. It does not make clinical decisions.</InfoTooltip></p>
      </form>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 font-medium text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      {data && (
        <>
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{region} · scheduled</p>
                <p className="mt-2 text-5xl font-black text-gray-900 dark:text-white">{data.total_scheduled}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Completion</p>
                <p className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">{completionPercentage}%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{data.completed} completed</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Overdue follow-ups</h2>
            {data.overdue.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No overdue follow-ups found for this region.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.overdue.map((item) => (
                  <li key={item.entry_id} className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
                    <p className="font-bold text-red-900 dark:text-red-200">{item.follow_up_type || 'Follow-up visit'}</p>
                    <p className="mt-1 text-sm text-red-800 dark:text-red-300">Due {item.follow_up_date} · Patient {item.patient_qr_id}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
