import { useEffect, useState } from 'react';
import InfoTooltip from './InfoTooltip';
import { getFollowUps } from '../services/followUps';

function formatFollowUpDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function UpcomingFollowUps() {
  const [followUps, setFollowUps] = useState([]);

  useEffect(() => {
    const loadFollowUps = () => getFollowUps().then(setFollowUps).catch((error) => {
      console.warn('Could not load follow-ups:', error);
    });
    loadFollowUps();
    window.addEventListener('rhp-follow-up-saved', loadFollowUps);
    return () => window.removeEventListener('rhp-follow-up-saved', loadFollowUps);
  }, []);

  return (
    <section className="max-w-4xl mx-auto mt-8 rounded-xl border border-blue-100 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
        Upcoming Follow-ups
        <InfoTooltip label="Explain follow-up reminders">These are follow-up dates saved on this device. A local notification is scheduled for the doctor's device when a date is provided.</InfoTooltip>
      </h2>
      {followUps.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No follow-ups scheduled on this device.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {followUps.map((followUp) => (
            <li key={followUp.local_id} className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/30 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{followUp.follow_up_type || 'Follow-up visit'}</span>
              <time className="text-sm font-bold text-emerald-700 dark:text-emerald-300" dateTime={followUp.follow_up_date}>{formatFollowUpDate(followUp.follow_up_date)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
