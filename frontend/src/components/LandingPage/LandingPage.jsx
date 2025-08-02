// src/components/LandingPage/LandingPage.jsx
import './LandingPage.css';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useModal } from '../../context/Modal';
import SignupFormModal from '../SignupFormModal';
import LoginFormModal from '../LoginFormModal';
import { login } from '../../store/session';
import '../UseState/UseState.css';
import UseState from '../UseState/UseState';
import { useState } from 'react';

const LandingPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const { setModalContent } = useModal();

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const handleDemoLogin = () => {
    dispatch(login({ credential: 'demo@user.io', password: 'password' }));
  };

  return (
    <div className={`landing-page-wrapper ${theme}`}>
      <div className={`landing-page-container ${theme}`}>
        <Link to="/profile">Go to Profile</Link>
        <br />
        <Link to="/connections">View Connections</Link>
        <UseState setTheme={setTheme} />
        <h1 className="landing-page-h1">Two Way</h1>
        <br />
        {!user && (
          <>
            <p className="landing-page-p">Please log in or sign up to create a profile.</p>
            <div>
              <button className={`round-btn ${theme}`} onClick={() => setModalContent(<SignupFormModal />)}>
                Sign up
              </button>
              <button className={`round-btn ${theme}`} onClick={() => setModalContent(<LoginFormModal />)}>
                Log in
              </button>
              <button className={`round-btn ${theme}`} onClick={handleDemoLogin}>
                Demo Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LandingPage;