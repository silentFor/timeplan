import React, { useState } from 'react';
import './register.css';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
	const [username, setUsername] = useState('');
	const [account, setAccount] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [email, setEmail] = useState('');
	const [intro, setIntro] = useState('');
	const [errors, setErrors] = useState([]);
	const [loading, setLoading] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();

	const accountRegex = /^[A-Za-z0-9_.@]+$/;

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const validate = () => {
		const e = [];
		if (!username.trim()) e.push('用户名为必填');
		if (!account.trim()) e.push('账号为必填');
		else if (!accountRegex.test(account)) e.push('账号只允许字母、数字、下划线、点和@');
		if (!password) e.push('密码为必填');
	
		else if (password.length < 8) e.push('密码需至少 8 位');
		if (!confirm) e.push('请确认密码');
		else if (password !== confirm) e.push('两次输入的密码不一致');
		if (!email.trim()) e.push('邮箱为必填');
		else if (!emailRegex.test(email)) e.push('请输入有效的邮箱地址');
		if (intro.length > 100) e.push('不超过100字');
		return e;
	};

	const handleSubmit = (ev) => {
		ev.preventDefault();
		const e = validate();
		setErrors(e);
		if (e.length) return;
		setLoading(true);
		const payload = { account, password, email, user_name: username, c_memo: intro };
		fetch('http://127.0.0.1:5000/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})
			.then(async (resp) => {
				const json = await resp.json().catch(() => ({}));
				if (!resp.ok) {
					setErrors([json.message || '注册失败']);
				} else {
					// try to log user in automatically
					const respData = json.data || {};
					const token = respData.token || respData.access_token || json.token;
					const userObj = respData.user || { username: respData.username || username, account };
					if (token) {
						login({ user: userObj, token });
						navigate('/');
					} else {
						// fallback: call login endpoint to obtain token
						fetch('http://127.0.0.1:5000/auth/login', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ account, password }),
						})
							.then(async (r2) => {
								const j2 = await r2.json().catch(() => ({}));
								if (r2.ok) {
									const resp2 = j2.data || {};
									const t2 = resp2.token || resp2.access_token || j2.token;
									const u2 = resp2.user || { username: resp2.username || username, account };
									if (t2) {
										login({ user: u2, token: t2 });
										navigate('/');
									}
								}
							})
							.catch(() => {});
					}
				}
			})
			.catch((err) => {
				setErrors([err.message || '网络错误']);
			})
			.finally(() => setLoading(false));
	};

	return (
		<div className="rp-wrapper">
			<form className="rp-card" onSubmit={handleSubmit}>
				<h2 className="rp-title">注册</h2>

				<div className="rp-field">
					<label className="rp-label">用户名</label>
					<input className="rp-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="昵称" />
				</div>

				<div className="rp-field">
					<label className="rp-label">账号</label>
					<input className="rp-input" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="账号" />
				</div>

				<div className="rp-field">
					<label className="rp-label">密码</label>
					<input className="rp-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" />
				</div>

				<div className="rp-field">
					<label className="rp-label">确认密码</label>
					<input className="rp-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="再次输入密码" />
				</div>

				<div className="rp-field">
					<label className="rp-label">邮箱</label>
					<input className="rp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" />
				</div>

				<div className="rp-field">
					<label className="rp-label">简介</label>
					<textarea className="rp-input" style={{height: '86px', resize: 'vertical'}} value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={100} placeholder="简介.." />
				</div>

				{errors.length > 0 && (
					<div className="rp-error">
						<ul style={{margin:0, paddingLeft: '18px'}}>
							{errors.map((it, idx) => <li key={idx}>{it}</li>)}
						</ul>
					</div>
				)}

				<button className="rp-btn" type="submit" disabled={loading}>{loading ? '提交中...' : '注册'}</button>

			</form>
		</div>
	);
}

