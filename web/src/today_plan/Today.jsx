import React, { useEffect, useState } from 'react';
import './today.css';
import { useAuth, logoutOn401 } from '../auth/AuthContext';

export default function Today() {
  const { user, token } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteKey, setDeleteKey] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // 筛选今日计划
  const todayRecords = records.filter(r => (r.v_date || '').slice(0, 10) === todayStr);

  // 获取数据
  const fetchRecords = () => {
    if (!user || !token) {
      setError('请先登录');
      setRecords([]);
      return;
    }
    setLoading(true);
    setError('');
    fetch('http://127.0.0.1:5000/records/get_records_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async (resp) => {
        if (resp.status === 401) {
          logoutOn401();
          setError('登录已过期，请重新登录');
          setRecords([]);
          return;
        }
        const json = await resp.json().catch(() => ({}));
        if (resp.ok && Array.isArray(json.data)) {
          setRecords(json.data);
        } else {
          setError(json.message || '获取记录失败');
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line
  }, [user, token]);

  // 执行删除
  const doDelete = async (row) => {
    if (!token) return;
    const sche_id = row.sche_id;
    if (!sche_id) {
      alert('缺少sche_id，无法删除');
      return;
    }
    try {
      const resp = await fetch('http://127.0.0.1:5000/records/delete_records_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sche_id })
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok && json.code === 0) {
        setDeleteKey(null);
        fetchRecords();
      }
    } catch (e) {
      console.error('删除失败', e);
    }
  };

  const handleDeleteClick = (rowKey) => {
    setDeleteKey(rowKey);
  };

  const handleDeleteCancel = () => {
    setDeleteKey(null);
  };

  return (
    <div className="today-wrapper">
      <div className="today-container">
        <div className="today-header">
          <h1 className="today-title">今日计划</h1>
          <div className="today-date">{todayStr}</div>
        </div>
        
        {loading && <div className="today-loading">加载中...</div>}
        {error && <div className="today-error">{error}</div>}
        
        <div className="today-content">
          {todayRecords.length === 0 ? (
            <div className="today-empty">
              <div className="today-empty-icon">📋</div>
              <div className="today-empty-text">今日暂无计划</div>
              <div className="today-empty-hint">快去创建一个新的计划吧！</div>
            </div>
          ) : (
            <div className="today-list">
              {todayRecords.map((rec, idx) => (
                <div key={'today-' + idx} className="today-item">
                  <div className="today-item-header">
                    <span className="record-dot dot-today" />
                    <span className="today-item-title">{rec.v_title}</span>
                    <span className="today-item-time">{rec.v_date?.slice(11, 16) || ''}</span>
                  </div>
                  <div className="today-item-body">
                    <p className="today-item-content">{rec.v_content}</p>
                  </div>
                  <div className="today-item-footer">
                    <span className="today-item-create">制定于: {rec.create_time}</span>
                    <div className="today-item-actions">
                      <button className="record-btn record-btn-edit">修改</button>
                      <button className="record-btn record-btn-delete" onClick={() => handleDeleteClick('today-' + idx)}>删除</button>
                      {deleteKey === 'today-' + idx && (
                        <div className="bubble-confirm-box">
                          <button className="record-btn record-btn-delete" onClick={() => doDelete(rec)}>确认</button>
                          <button className="record-btn record-btn-edit" onClick={handleDeleteCancel}>取消</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
