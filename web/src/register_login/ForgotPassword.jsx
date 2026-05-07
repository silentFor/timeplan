import React, { useState, useEffect, useRef } from 'react';
import './register.css';
import { useNavigate, Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = () => {
    if (!email.trim()) {
      setErrors(['请输入邮箱地址']);
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors(['请输入有效的邮箱地址']);
      return;
    }
    if (countdown > 0) return;
    setSendingCode(true);
    setErrors([]);
    fetch('http://127.0.0.1:5000/msg/send_verification_code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'reset_password' }),
    })
      .then(async (resp) => {
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setErrors([json.message || '发送验证码失败']);
        } else {
          startCountdown();
        }
      })
      .catch(() => setErrors(['网络错误']))
      .finally(() => setSendingCode(false));
  };

  const validate = () => {
    const e = [];
    if (!email.trim()) e.push('邮箱为必填');
    else if (!emailRegex.test(email)) e.push('请输入有效的邮箱地址');
    if (!verificationCode.trim()) e.push('验证码为必填');
    if (!password) e.push('新密码为必填');
    else if (password.length < 8) e.push('密码需至少 8 位');
    if (!confirm) e.push('请确认密码');
    else if (password !== confirm) e.push('两次输入的密码不一致');
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (e.length) return;
    setLoading(true);
    const payload = {
      email,
      verification_code: verificationCode,
      new_password: password,
    };
    fetch('http://127.0.0.1:5000/auth/reset_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (resp) => {
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setErrors([json.message || '重置密码失败']);
        } else {
          alert('密码重置成功，请使用新密码登录');
          navigate('/login');
        }
      })
      .catch(() => setErrors(['网络错误']))
      .finally(() => setLoading(false));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">重置密码</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>邮箱</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入注册邮箱"
            />
          </div>
          <div className="auth-field">
            <label>验证码</label>
            <div className="auth-code-row">
              <input
                className="auth-input auth-code-input"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入验证码"
              />
              <button
                type="button"
                className="auth-code-btn"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
              >
                {countdown > 0 ? `${countdown}秒后重发` : (sendingCode ? '发送中...' : '获取验证码')}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label>新密码</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="新密码（至少8位）"
            />
          </div>
          <div className="auth-field">
            <label>确认新密码</label>
            <input
              className="auth-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次输入新密码"
            />
          </div>
          {errors.length > 0 && (
            <div className="auth-error">
              <ul>
                {errors.map((it, idx) => <li key={idx}>{it}</li>)}
              </ul>
            </div>
          )}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '提交中...' : '重置密码'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login">返回登录</Link>
        </div>
      </div>
    </div>
  );
}
