import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('pos_token');
      const savedUser = localStorage.getItem('pos_user');
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const { data } = await api.get('/auth/me');
          if (data.success) {
            setUser(data.data);
            localStorage.setItem('pos_user', JSON.stringify(data.data));
          }
        } catch {
          localStorage.removeItem('pos_token');
          localStorage.removeItem('pos_user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('pos_token', data.data.token);
      localStorage.setItem('pos_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
