import React, { useEffect, useState } from 'react';
import { useAuth, logoutOn401 } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state && location.state.userData) return;
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
        } else {
          setError(json.message || '获取用户信息失败');
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  }, [user, token, location.state]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const submitData = { ...form };
    if (!submitData.user_id && user && user.user_id) {
      submitData.user_id = user.user_id;
    }
    // 删除不可修改的 account 字段，避免误传
    delete submitData.account;
    fetch('http://127.0.0.1:5000/auth/update_user_msg', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitData),
    })
      .then(async (resp) => {
        if (resp.status === 401) {
          logoutOn401();
          setError('登录已过期，请重新登录');
          return;
        }
        const json = await resp.json().catch(() => ({}));
        if (resp.ok && json.data) {
          const newToken = json.token || json.data.token || token;
          login({ user: json.data, token: newToken });
          setForm(json.data);
          fetch('http://127.0.0.1:5000/auth/get_user_msg', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: json.data.email }),
          })
            .then(async (userResp) => {
              if (userResp.status === 401) {
                logoutOn401();
                setError('登录已过期，请重新登录');
                return;
              }
              const userJson = await userResp.json().catch(() => ({}));
              if (userResp.ok && userJson.data) {
                login({ user: userJson.data, token: newToken });
              }
            })
            .finally(() => {
              alert('保存成功，请重新登录');
              login({ user: null, token: null });
              navigate('/login');
            });
        } else {
          setError(json.message || '保存失败');
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  };

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
