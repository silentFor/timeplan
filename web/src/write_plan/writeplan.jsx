import React, { useState } from 'react';
import './writeplan.css';
import { useAuth, logoutOn401 } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Planner = () => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { token } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type });
    }, 2500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    const formattedDate = date.replace(/-/g, '');
    const data = {
      v_date: formattedDate,
      title: title,
      content: content,
    };

    if (!token) {
      showToast('请先登录以保存计划', 'error');
      navigate('/login');
      return;
    }

    setLoading(true);
    fetch('http://127.0.0.1:5000/write/write_plan_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
      .then(async response => {
        if (response.status === 401) {
          logoutOn401();
          showToast('登录已过期，请重新登录', 'error');
          return;
        }
        if (!response.ok) {
          throw new Error('网络响应不正常');
        }
        const respData = await response.json();
        if (respData.code !== 0) {
          showToast(respData.message || '上传失败', 'error');
          return;
        }
        showToast(respData.message || '日程安排成功', 'success');
        setDate(today);
        setTitle('');
        setContent('');
      })
      .catch(() => {
        showToast('保存失败，请稍后重试', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="write-wrapper">
      <div className="write-container">
        <div className="write-header">
          <h1 className="write-title">新建计划</h1>
          <p className="write-subtitle">安排你的日程，记录待办事项</p>
        </div>
        <form onSubmit={handleSubmit} className="write-form">
          <div className="form-group">
            <label htmlFor="date">安排时间</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">标题</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="计划主题"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">内容</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述你的计划内容"
              required
            />
          </div>
          <div className="write-actions">
            <button type="button" className="write-btn write-btn-secondary" onClick={() => { setDate(today); setTitle(''); setContent(''); }}>
              重置
            </button>
            <button type="submit" className="write-btn write-btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>

      {toast.show && (
        <div className={`write-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Planner;
