import logo from './logo.svg';
import './App.css';

import Main from './main_page/mainpage';
import Planner from './write_plan/writeplan';
import Register from './register_login/register';
import Login from './register_login/login';
import { AuthProvider } from './auth/AuthContext';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfile from './register_login/user_profile';
import Records from './records/records';
import Today from './today_plan/Today';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />

          <main style={{ paddingTop: 12 }}>
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/plans" element={<Planner />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user_profile" element={<UserProfile />} />
              <Route path="/records" element={<Records />} />
              <Route path="/today" element={<Today />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
