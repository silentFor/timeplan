import './mainpage.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function Main() {
  const { user } = useAuth();
  return (
    <div className="main-page">
      <div className="main-card">
        <h1 className="main-title">欢迎来到时间旅程</h1>
        <p className="main-desc">
          一个简单实用的时间管理工具，帮助你规划日程、记录待办事项，
          让每一天都过得更有条理。<br />
          我们将提前一天给您邮件提醒，当天早上六点也会发送当天计划的邮件，确保您不错过任何重要的事情。<br />
          立即开始规划你的时间旅程吧！
        </p>
        <div className="main-actions">
          <Link className="main-btn main-btn-primary" to="/plans">旅程与计划</Link>
          <Link className="main-btn main-btn-secondary" to="/today">今日计划</Link>
          <Link className="main-btn main-btn-secondary" to="/records">我的计划</Link>
        </div>
        {!user && (
          <div className="main-footer">
            请 <Link to="/login">登录</Link> 或 <Link to="/register">注册</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Main;
