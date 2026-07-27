import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aqua_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    setUser(data.user);
    localStorage.setItem('aqua_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');

    setUser(data.user);
    localStorage.setItem('aqua_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aqua_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
