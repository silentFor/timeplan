import React, { useState } from 'react';
import './records.css';
import { useAuth, logoutOn401 } from '../auth/AuthContext';

export default function TodayPlans({ records, onRefresh }) {
  const { token } = useAuth();
  const [deleteKey, setDeleteKey] = useState(null);

  // 筛选今日计划
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => (r.v_date || '').slice(0, 10) === todayStr);

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
        onRefresh && onRefresh();
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
    <div className="records-today-header">
      <div className="records-title">今日计划</div>
      <div className="records-today-content">
        {todayRecords.length === 0 ? (
          <div className="records-today-empty">今日暂无计划</div>
        ) : (
          todayRecords.map((rec, idx) => (
            <div key={'today-' + idx} className="records-today-item">
              <span className="record-dot dot-today" />
              <span className="records-today-title">{rec.v_title}</span>
              <span className="records-today-date">{rec.v_date}</span>
              <span className="records-today-text">{rec.v_content}</span>
              <div className="records-today-actions">
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
          ))
        )}
      </div>
    </div>
  );
}
