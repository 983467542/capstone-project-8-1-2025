// frontend/src/components/Navigation/ProfileButton.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import * as sessionActions from '../../store/session';
import { login } from '../../store/session';
// import OpenModalButton from '../OpenModalButton';
import OpenModalMenuItem from './OpenModalMenuItem';
import LoginFormModal from '../LoginFormModal';
import SignupFormModal from '../SignupFormModal';
import './ProfileButton.css';

function ProfileButton({ user }) {
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const [username, setUsername] = useState('');
  const ulRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/users/${user.id}`);
          if (response.ok) {
            const userData = await response.json();
            setUsername(userData.username);
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to fetch username');
          }
          setUsername(user.firstName || 'User');
        }
      } else {
        setUsername('');
      }
    };

    fetchUsername();
  }, [user?.id, user?.firstName]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    if (!showMenu) return;

    const closeMenu = (e) => {
      if (!ulRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', closeMenu);

    return () => document.removeEventListener("click", closeMenu);
  }, [showMenu]);

  const closeMenu = () => setShowMenu(false);

  const logout = async (e) => {
    e.preventDefault();
    await dispatch(sessionActions.logout());
    closeMenu();
    navigate('/');
  };

  const ulClassName = "profile-dropdown" + (showMenu ? "" : " hidden");

  const handleDemoLogin = async () => {
    await dispatch(login({ credential: 'demo@user.io', password: 'password' }));
    closeMenu();
    navigate('/');
  };

  return (
    <>
      <button onClick={toggleMenu}>
        <FaUserCircle />
      </button>
      <ul className={ulClassName} ref={ulRef}>
        {user ? (
          <>
            <li>{username || user.firstName || 'User'}</li>
            <li>
              <button className="logout-btn" onClick={logout}>Log Out</button>
            </li>
          </>
        ) : (
          <>
            <OpenModalMenuItem
              itemText="Log In"
              onItemClick={closeMenu}
              modalComponent={<LoginFormModal />}
            />
            <OpenModalMenuItem
              itemText="Sign Up"
              onItemClick={closeMenu}
              modalComponent={<SignupFormModal />}
            />
            <OpenModalMenuItem
              itemText="Demo Login"
              onItemClick={handleDemoLogin}
            />
          </>
        )}
      </ul>
    </>
  );
}

export default ProfileButton;