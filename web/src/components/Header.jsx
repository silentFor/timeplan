import React from 'react';
import './header.css';
import { useAuth, logoutOn401 } from '../auth/AuthContext';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, token, login, logout } = useAuth();
  console.log('Header user:', user);


  // 登录后自动获取一次用户信息并更新全局user
  React.useEffect(() => {
    async function fetchUserMsgOnLogin() {
      if (user && token && user.account) {
        try {
          const resp = await fetch('http://127.0.0.1:5000/auth/get_user_msg', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ account: user.account }),
          });
          if (resp.status === 401) {
            logoutOn401();
            return;
          }
          const json = await resp.json().catch(() => ({}));
          if (resp.ok && json.data) {
            login({ user: json.data, token });
          }
        } catch {}
      }
    }
    fetchUserMsgOnLogin();
    // 只在user/account变化时调用
    // eslint-disable-next-line
  }, [user && user.account, token]);
  const navigate = useNavigate();

  const username = user && user.user_name;
  console.log('Header username:', username);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  

  return (
    <header className="app-header">
      <div className="header-left">
        <Link className="brand" to="/">
          时间旅程
        </Link>
      </div>

      <nav className="header-center">
        <NavLink className="nav-item" to="/" end>
          首页
        </NavLink>
        <NavLink className="nav-item" to="/plans">
          旅程与计划
        </NavLink>
        <NavLink className="nav-item" to="/today">
          今日计划
        </NavLink>
        <NavLink className="nav-item" to="/records">
          我的计划
        </NavLink>
      </nav>
    
      <div className="header-right">
        
        {user ? (
          <>
            <div className="user-info-wrapper">
              <span
                className="user-name"
                tabIndex={0}
                onClick={async () => {
                  if (user && token) {
                    try {
                      const resp = await fetch('http://127.0.0.1:5000/auth/get_user_msg', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ account: user.account }),
                      });
                      if (resp.status === 401) {
                        logoutOn401();
                        return;
                      }
                      const json = await resp.json().catch(() => ({}));
                      if (resp.ok && json.data) {
                        navigate('/user_profile', { state: { userData: json.data } });
                        return;
                      }
                    } catch {}
                  }
                  navigate('/user_profile');
                }}

              >
                {username}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>退出</button>
          </>
        ) : (
          <>
            <Link className="header-link" to="/login">登录</Link>
            <Link className="header-link" to="/register">注册</Link>
          </>
        )}
      </div>
    </header>

  );
}

