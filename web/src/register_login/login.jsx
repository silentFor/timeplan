import React, { useState } from 'react';
import './login.css';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
    const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = (e) => {
		e.preventDefault();
		setError('');
		if (!username || !password) {
			setError('请输入账号和密码');
			return;
		}
		setLoading(true);
		fetch('http://127.0.0.1:5000/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ account: username, password }),
		})
			.then(async (resp) => {
				const json = await resp.json().catch(() => ({}));
				if (!resp.ok) {
					setError(json.message || '登录失败');
				} else {
					console.log('登录返回数据：', json.data);
					// extract user/token from response (adjust according to backend)
					const respData = json.data || {};
					const token = respData.token || respData.access_token || json.token;
					// 用后端返回的完整用户对象（含user_name等字段）
					login({ user: respData, token });
					navigate('/');
				}
			})
			.catch(() => setError('网络错误'))
			.finally(() => setLoading(false));
	};

	return (
		<div className="rp-wrapper">
			<form className="rp-card" onSubmit={handleSubmit}>
				<h2 className="rp-title">时间旅程登录</h2>

				<div className="rp-field">
					<label className="rp-label">账号</label>
					<input
						className="rp-input"
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="请输入账号"
					/>
				</div>

				<div className="rp-field">
					<label className="rp-label">密码</label>
					<input
						className="rp-input"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="请输入密码"
					/>
				</div>
				{error && <div className="rp-error">{error}</div>}
				<button className="rp-btn" type="submit" disabled={loading}>
					{loading ? '登录中...' : '登录'}
				</button>

				<div className="rp-footer">
					<a className="rp-link" href="#">忘记密码？</a>
					<span style={{ margin: '0 8px', color: '#bbb' }}>|</span>
					<Link className="rp-link" to="/register">注册</Link>
				</div>
			</form>
		</div>
	);
}

