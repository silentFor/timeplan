import React, { useState } from 'react';
import './writeplan.css';
import { useAuth, logoutOn401 } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Planner = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedDate = date.replace(/-/g, '');
    const data = {
      'v_date': formattedDate,
      'title': title,
      'content': content,
      // include a user identifier from the authenticated context (not from user input)
      'account': (user && (user.account || user.username || user.name)) || null,
      'user_id': (user && (user.id || user.user_id)) || null
    };

    if (!token) {
      alert('请先登录以保存计划');
      navigate('/login');
      return;
    }

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
        alert('登录已过期，请重新登录');
        return;
      }
      if (!response.ok) {
        throw new Error('网络响应不正常');
      }
      const data = await response.json();
      console.log('上传结果:', data);
      if (data.code !== 0) {
        alert(data.message || '上传失败');
        return;
      }
      alert(data.message || '上传成功');
      setDate(today);
      setTitle('');
      setContent('');
    })
    .catch(error => {
      console.error('错误:', error);  
      alert('错误');
    });
};

  return (
    <div className="wp-wrapper">
      <div className="planner-container">
        <h1>旅程</h1>
        <p className="planner-subtitle">记录你的日程与计划，让每一天更有条理~</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">


            <label htmlFor="date">安排时间:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={handleDateChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">标题:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="主题"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">内容:</label>
            <textarea
              id="content"
              value={content}
              onChange={handleContentChange}
              placeholder="计划...."
              required
            />
          </div>
          <div className="actions-row">
            <button type="submit" className="submit-button">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Planner;
