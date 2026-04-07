
import React, { useEffect, useState } from 'react';
import './records.css';
import { useAuth, logoutOn401 } from '../auth/AuthContext';
import TodayPlans from './TodayPlans';
import RecordsTable from './RecordsTable';

export default function Records() {
  const { user, token } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // 调试输出
  console.log('[Records] user:', user, 'token:', token ? '有' : '无', 'records数量:', records.length, 'error:', error);

  return (
    <div className="records-wrapper">
      {/* 今日计划头部栏 */}
      {/* <TodayPlans records={records} onRefresh={fetchRecords} /> */}
      {/* 我的旅程计划记录表格 */}
      <RecordsTable records={records} loading={loading} error={error} onRefresh={fetchRecords} />
    </div>
  );
}
