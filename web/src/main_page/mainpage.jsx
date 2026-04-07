import './mainpage.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';


function Main() {
    const { user } = useAuth();
    return (
        <div className="Center">
            <header className='Character'>
                <p>欢迎！</p>
                <p className='Description'>
                    这是一个致力于分享知识与经验的平台，旨在为每位用户提供丰富的信息和优质的服务。希望您在这里找到所需的灵感与帮助！
                </p>
                <div className="mainpage-btn-group">
                    <Link className="mainpage-btn mainpage-btn-plan" to="/plans">旅程与计划</Link>
                    <Link className="mainpage-btn mainpage-btn-today" to="/today">今日计划</Link>
                    <Link className="mainpage-btn mainpage-btn-records" to="/records">我的计划</Link>
                </div>
                <footer className='Footer'>
                    {!user && (
                        <p className='LoginPrompt'>
                            请 <Link to="/login">登录</Link> 或 <Link to="/register">注册</Link>。
                        </p>
                    )}
                </footer>
                {/* 按钮区域，描述下方三行后 */}
            </header>
        </div>
        );
    }

export default Main;
