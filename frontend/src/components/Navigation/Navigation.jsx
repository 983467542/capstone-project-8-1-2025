// frontend/src/components/Navigation/Navigation.jsx
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProfileButton from './ProfileButton';
import './Navigation.css';

function Navigation({ isLoaded }) {
  const sessionUser = useSelector(state => state.session.user);
  const location = useLocation();
  const navigate = useNavigate();

  const [, setShowSpecificChats] = useState(location.pathname === '/chat-messages');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAllChatsClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/chat-messages') {
      navigate('/chat-messages');
      setShowSpecificChats(true);
    } else {
      setShowSpecificChats(prev => !prev);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <>
      <button className="sidebar-toggle-button" onClick={toggleSidebar}>
        {sidebarOpen ? '>' : '☰'}
      </button>

      {/* <div className="navigation-wrapper"> */}
      <nav className={`navigation ${sidebarOpen ? 'open' : 'closed'}`}>
        <span>
          <NavLink to="/">Home</NavLink>
        </span>

        {isLoaded && (
          <>
            <span>
              <ProfileButton user={sessionUser} />
            </span>
            <span>
              <NavLink to="/profile">Profile</NavLink>
            </span>
          </>
        )}

        <span>
          <NavLink to="/connections">Connections</NavLink>
        </span>

        <span>
          <a href="/chat-messages" onClick={handleAllChatsClick}>
            All Chats
          </a>
        </span>

        {/* <span>
          <NavLink to="/guess-me-game">Guess Me Game</NavLink>
        </span> */}

        {/* <span>
          <NavLink to="/game-plays">Game Play</NavLink>
        </span> */}

        <span>
          <NavLink to="/game-start">Game Play</NavLink>
        </span>
      </nav>
      {/* </div> */}
    </>
  );
}

export default Navigation;