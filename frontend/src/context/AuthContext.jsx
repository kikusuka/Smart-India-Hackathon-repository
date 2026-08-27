import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[0];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [doctorId, setDoctorId] = useState(() => {
    const token = localStorage.getItem('rhp-doctor-token');
    if (token) {
      const payload = parseJwt(token);
      if (payload?.doctor_id) return payload.doctor_id;
    }
    return null;
  });
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('rhp-doctor-name') || '');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = (token, name) => {
    localStorage.setItem('rhp-doctor-token', token);
    localStorage.setItem('rhp-doctor-name', name);
    const payload = parseJwt(token);
    if (payload?.doctor_id) setDoctorId(payload.doctor_id);
    setDoctorName(name);
  };

  const logout = () => {
    localStorage.removeItem('rhp-doctor-token');
    localStorage.removeItem('rhp-doctor-name');
    setDoctorId(null);
    setDoctorName('');
    setStats(null);
  };

  const fetchStats = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const { getDoctorStats } = await import('../services/api');
      const data = await getDoctorStats(doctorId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch doctor stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [doctorId]);

  return (
    <AuthContext.Provider value={{ 
      doctorId, 
      doctorName, 
      stats, 
      loading,
      login, 
      logout,
      refetchStats: fetchStats,
      isAuthenticated: !!doctorId
    }}>
      {children}
    </AuthContext.Provider>
  );
};