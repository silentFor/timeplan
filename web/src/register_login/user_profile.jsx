import React, { useEffect, useState, useRef } from 'react';
import { useAuth, logoutOn401 } from '../auth/AuthContext';
import { useLocation } from 'react-router-dom';
import './user_profile.css';

export default function UserProfile() {
  const { user, token, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState(() => {
    if (location.state && location.state.userData) {
      return location.state.userData;
    }
    return { ...user };
  });
  const [originalEmail, setOriginalEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (location.state && location.state.userData) {
      setOriginalEmail(location.state.userData.email || '');
      return;
    }
    if (!user || !token) return;
    setLoading(true);
    fetch('http://127.0.0.1:5000/auth/get_user_msg', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email }),
    })
      .then(async (resp) => {
        if (resp.status === 401) {
          logoutOn401();
          setError('登录已过期，请重新登录');
          return;
        }
        const json = await resp.json().catch(() => ({}));
        if (resp.ok && json.data) {
          setForm(json.data);
          setOriginalEmail(json.data.email || '');
        } else {
          setError(json.message || '获取用户信息失败');
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  }, [user, token, location.state]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    const email = form.email;
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (email === originalEmail) {
      setError('邮箱未修改，无需验证');
      return;
    }
    if (countdown > 0) return;
    setSendingCode(true);
    setError('');
    fetch('http://127.0.0.1:5000/msg/send_verification_code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        purpose: 'update_email',
        current_email: originalEmail,
      }),
    })
      .then(async (resp) => {
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setError(json.message || '发送验证码失败');
        } else {
          startCountdown();
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setSendingCode(false));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const userId = form.user_id || user?.user_id;
    if (!userId) {
      setError('用户ID缺失');
      setLoading(false);
      return;
    }

    const emailChanged = form.email && form.email !== originalEmail;

    const updateOtherFields = (currentToken) => {
      const payload = {
        user_id: userId,
        user_name: form.user_name,
        c_memo: form.c_memo,
      };
      // 如果邮箱没变，可以顺带更新；如果变了，已在 update_email 中更新
      if (!emailChanged) {
        payload.email = form.email;
      }
      fetch('http://127.0.0.1:5000/auth/update_user_msg', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(async (resp) => {
          if (resp.status === 401) {
            logoutOn401();
            setError('登录已过期，请重新登录');
            return;
          }
          const json = await resp.json().catch(() => ({}));
          if (resp.ok && json.data) {
            const newToken = json.data.token || currentToken;
            login({ user: json.data, token: newToken });
            setOriginalEmail(json.data.email || '');
            alert('保存成功');
          } else {
            setError(json.message || '保存失败');
          }
        })
        .catch(() => setError('网络错误'))
        .finally(() => setLoading(false));
    };

    if (emailChanged) {
      if (!verificationCode) {
        setError('修改邮箱需要填写验证码');
        setLoading(false);
        return;
      }
      fetch('http://127.0.0.1:5000/auth/update_email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          new_email: form.email,
          verification_code: verificationCode,
        }),
      })
        .then(async (resp) => {
          if (resp.status === 401) {
            logoutOn401();
            setError('登录已过期，请重新登录');
            setLoading(false);
            return;
          }
          const json = await resp.json().catch(() => ({}));
          if (resp.ok && json.data) {
            const newToken = json.data.token || token;
            login({ user: json.data, token: newToken });
            setOriginalEmail(json.data.email || '');
            setVerificationCode('');
            // 邮箱更新成功后再更新其他字段
            updateOtherFields(newToken);
          } else {
            setError(json.message || '邮箱修改失败');
            setLoading(false);
          }
        })
        .catch(() => {
          setError('网络错误');
          setLoading(false);
        });
    } else {
      updateOtherFields(token);
    }
  };

  const emailModified = form.email !== originalEmail;

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <h2 className="profile-title">个人信息</h2>
        {error && <div className="profile-error">{error}</div>}
        <form className="profile-form" onSubmit={handleSave}>
          <div className="profile-field">
            <label>账号</label>
            <input value={form.account || ''} name="account" readOnly disabled />
          </div>
          <div className="profile-field">
            <label>用户名</label>
            <input value={form.user_name || ''} name="user_name" onChange={handleChange} />
          </div>
          <div className="profile-field">
            <label>邮箱</label>
            <input value={form.email || ''} name="email" onChange={handleChange} />
          </div>
          {emailModified && (
            <div className="profile-field">
              <label>验证码</label>
              <div className="profile-code-row">
                <input
                  className="profile-code-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入验证码"
                />
                <button
                  type="button"
                  className="profile-code-btn"
                  onClick={handleSendCode}
                  disabled={sendingCode || countdown > 0}
                >
                  {countdown > 0 ? `${countdown}秒后重发` : (sendingCode ? '发送中...' : '获取验证码')}
                </button>
              </div>
            </div>
          )}
          <div className="profile-field">
            <label>备注</label>
            <input value={form.c_memo || ''} name="c_memo" onChange={handleChange} />
          </div>
          <div className="profile-field">
            <label>创建时间</label>
            <span>{form.create_time || ''}</span>
          </div>
          <div className="profile-field">
            <label>更新时间</label>
            <span>{form.update_time || ''}</span>
          </div>
          <div className="profile-actions">
            <button className="profile-btn" type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
