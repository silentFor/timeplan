import React, { useState } from 'react';
import './records.css';
import { useAuth } from '../auth/AuthContext';
import Pagination from './Pagination';

const PAGE_SIZE = 20;

export default function RecordsTable({ records, loading, error, onRefresh }) {
  const { token } = useAuth();
  const [deleteKey, setDeleteKey] = useState(null);
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const sortedRecords = [...records].sort((a, b) => {
    if (!a.v_date || !b.v_date) return 0;
    if (sortAsc) {
      return a.v_date.localeCompare(b.v_date);
    } else {
      return b.v_date.localeCompare(a.v_date);
    }
  });

  const otherRecords = sortedRecords.filter(r => (r.v_date || '').slice(0, 10) !== todayStr);
  const totalPages = Math.ceil(otherRecords.length / PAGE_SIZE);
  const pagedRecords = otherRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleSortToggle = () => {
    setSortAsc((asc) => !asc);
    setPage(1);
  };

  return (
    <>
      <div className="records-header">
        <div className="records-title">我的旅程计划记录</div>
        <div className="records-toolbar">
          <button className="record-btn record-btn-edit" onClick={onRefresh}>刷新</button>
        </div>
      </div>
      {loading && <div style={{ textAlign: 'center', padding: 24, color: '#6c757d' }}>加载中...</div>}
      {error && <div style={{ color: '#dc3545', marginBottom: 12 }}>{error}</div>}
      <div className="records-table-scroll">
        <table className="records-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>计划标题</th>
              <th className="sortable-th" onClick={handleSortToggle}>
                计划实施时间
                <span className="sort-indicator">{sortAsc ? '▲' : '▼'}</span>
              </th>
              <th>计划内容</th>
              <th>制定计划时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: '#6c757d', textAlign: 'center', padding: 32 }}>暂无记录</td>
              </tr>
            ) : (
              pagedRecords.map((rec, idx) => {
                const recDate = (rec.v_date || '').slice(0, 10);
                let dotClass = 'dot-future';
                if (recDate < todayStr) dotClass = 'dot-past';
                else if (recDate === todayStr) dotClass = 'dot-today';
                return (
                  <tr key={idx}>
                    <td>
                      <span className={`record-dot ${dotClass}`} />
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td>{rec.v_title}</td>
                    <td>{rec.v_date}</td>
                    <td>{rec.v_content}</td>
                    <td>{rec.create_time}</td>
                    <td style={{ position: 'relative', whiteSpace: 'nowrap' }}>
                      <button className="record-btn record-btn-edit">修改</button>
                      <button className="record-btn record-btn-delete" onClick={() => handleDeleteClick('other-' + idx)}>删除</button>
                      {deleteKey === 'other-' + idx && (
                        <div className="bubble-confirm-box">
                          <button className="record-btn record-btn-delete" onClick={() => doDelete(rec)}>确认</button>
                          <button className="record-btn record-btn-edit" onClick={handleDeleteCancel}>取消</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </>
  );
}
