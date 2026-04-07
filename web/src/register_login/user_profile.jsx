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

  // 如果没有通过路由传递数据，则请求接口
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
      body: JSON.stringify({ account: user.account }),
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

  // 修改表单字段
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 保存修改
  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // 保证 user_id 一定传递
    const submitData = { ...form };
    if (!submitData.user_id && user && user.user_id) {
      submitData.user_id = user.user_id;
    }
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
          // 若后端返回新的token则用新token，否则用旧token
          const newToken = json.token || json.data.token || token;
          // 用后端返回的完整用户对象（含user_name等字段）
          login({ user: json.data, token: newToken });
          setForm(json.data);
          // 再主动获取一次全量用户信息，确保全局user为最新
          fetch('http://127.0.0.1:5000/auth/get_user_msg', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ account: json.data.account }),
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
              // 退出登录并跳转到登录界面
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
    <div className="user-profile-bg">
      <div className="user-profile-wrapper">
        <h2>个人信息</h2>
        {error && <div className="error-msg">{error}</div>}
        <form className="user-profile-form" onSubmit={handleSave}>
          <div>
            <label>账号：</label>
            <input value={form.account || ''} name="account" onChange={handleChange} />
          </div>
          <div>
            <label>用户名：</label>
            <input value={form.user_name || ''} name="user_name" onChange={handleChange} />
          </div>
          <div>
            <label>邮箱：</label>
            <input value={form.email || ''} name="email" onChange={handleChange} />
          </div>
          <div>
            <label>备注：</label>
            <input value={form.c_memo || ''} name="c_memo" onChange={handleChange} />
          </div>
          <div>
            <label>创建时间：</label>
            <span>{form.create_time || ''}</span>
          </div>
          <div>
            <label>更新时间：</label>
            <span>{form.update_time || ''}</span>
          </div>
          <button type="submit" disabled={loading}>{loading ? '保存中...' : '保存修改'}</button>
        </form>
      </div>
    </div>
  );
}
