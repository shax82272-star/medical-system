import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then((res) => {
          setUser(res.data);
          setRole(res.data.role);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setRole(res.data.role);
    return res.data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRole(null);
  };

  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, isAdmin, isDoctor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
