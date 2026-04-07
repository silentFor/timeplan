import React, { createContext, useContext, useEffect, useState } from 'react';


let globalLogout = null;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth');
      if (raw) {
        const data = JSON.parse(raw);
        setUser(data.user || null);
        setToken(data.token || null);
      }
    } catch (e) {}
  }, []);

  const login = ({ user: u, token: t }) => {
    // 深拷贝user，确保状态变更能被感知
    const userCopy = u ? JSON.parse(JSON.stringify(u)) : null;
    console.log('login() called, user:', userCopy, 'token:', t);
    setUser(userCopy);
    setToken(t || null);
    localStorage.setItem('auth', JSON.stringify({ user: userCopy, token: t || null }));
  };


  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  };
  // 让全局可用
  globalLogout = logout;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


// 提供全局logout方法
export function logoutOn401() {
  if (typeof globalLogout === 'function') globalLogout();
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
