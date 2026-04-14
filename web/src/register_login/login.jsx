import React, { useState } from 'react';
import './login.css';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('请输入账号和密码');
      return;
    }
    setLoading(true);
    fetch('http://127.0.0.1:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: username, password }),
    })
      .then(async (resp) => {
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setError(json.message || '登录失败');
        } else {
          const respData = json.data || {};
          const token = respData.token || respData.access_token || json.token;
          login({ user: respData, token });
          navigate('/');
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">登录</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>账号</label>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
            />
          </div>
          <div className="auth-field">
            <label>密码</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/register">还没有账号？去注册</Link>
        </div>
      </div>
    </div>
  );
}
