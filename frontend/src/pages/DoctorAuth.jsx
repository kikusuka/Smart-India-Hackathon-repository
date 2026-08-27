import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginDoctor, signupDoctor } from '../services/api';

export default function DoctorAuth() {
  const { login, isAuthenticated, doctorName, logout } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ doctor_id: '', doctor_name: '', region: '', password: '', confirm_password: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError('');
    if (!form.doctor_id.trim() || !form.password) {
      setError('Doctor ID and password are required.');
      return;
    }
    if (isSignup && (!form.doctor_name.trim() || !form.region.trim())) {
      setError('Doctor name and region are required.');
      return;
    }
    if (isSignup && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (isSignup && form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await signupDoctor({ doctor_id: form.doctor_id.trim(), doctor_name: form.doctor_name.trim(), region: form.region.trim(), password: form.password });
        setIsSignup(false);
        setForm((current) => ({ ...current, password: '', confirm_password: '' }));
        setMessage('Account created. You can now sign in.');
      } else {
        const result = await loginDoctor({ doctor_id: form.doctor_id.trim(), password: form.password });
        login(result.access_token, result.doctor_name);
        setMessage('Signed in successfully.');
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to complete the request.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <section className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl p-8 text-center transition-colors">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Signed in</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{doctorName || 'Doctor account'}</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">Your connected sync session is ready.</p>
        <button onClick={logout} className="mt-8 rounded-lg bg-gray-900 dark:bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-gray-700 dark:hover:bg-emerald-500 transition-colors">Sign out</button>
      </section>
    );
  }

  return (
    <section className="max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Connected access</p>
        <h1 className="mt-3 text-4xl font-extrabold text-gray-900 dark:text-white">{isSignup ? 'Create doctor account' : 'Welcome back'}</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">Use a connected session for incremental patient record sync.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-xl transition-colors">
        {error && <div role="alert" className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</div>}
        {message && <div role="status" className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">{message}</div>}
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Doctor ID<input name="doctor_id" value={form.doctor_id} onChange={updateField} required autoComplete="username" className="mt-2 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" /></label>
        {isSignup && <>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Doctor name<input name="doctor_name" value={form.doctor_name} onChange={updateField} required autoComplete="name" className="mt-2 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" /></label>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Region<input name="region" value={form.region} onChange={updateField} required className="mt-2 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" /></label>
        </>}
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password<input name="password" type="password" value={form.password} onChange={updateField} required minLength={isSignup ? 8 : 1} autoComplete={isSignup ? 'new-password' : 'current-password'} className="mt-2 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />{isSignup && <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">Minimum 8 characters</span>}</label>
        {isSignup && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Confirm password<input name="confirm_password" type="password" value={form.confirm_password} onChange={updateField} required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" /></label>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-bold text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400 transition-colors">{loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}</button>
        <button type="button" onClick={() => { setIsSignup((current) => !current); setError(''); setMessage(null); }} className="w-full text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">{isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button>
      </form>
    </section>
  );
}
