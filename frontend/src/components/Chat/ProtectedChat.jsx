// frontend/src/components/Chat/ProtectedChat.jsx
import { useParams, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import Chat from './Chat';
import './ProtectedChat.css';

const ProtectedChat = () => {
  const { user1Id, user2Id } = useParams();
  const sessionUser = useSelector((state) => state.session.user);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionUser?.id) {
      const stored = localStorage.getItem(`filteredResults-${sessionUser.id}`);
      const results = stored ? JSON.parse(stored) : [];
      setFilteredResults(results);
      setLoading(false);
    }
  }, [sessionUser?.id]);

  if (!sessionUser) {
    return <Navigate to="/login" replace />;
  }

  const otherUserId = parseInt(user1Id) === sessionUser.id ? parseInt(user2Id) : parseInt(user1Id);
  if (parseInt(user1Id) !== sessionUser.id && parseInt(user2Id) !== sessionUser.id) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <p>Loading filtered results...</p>;
  }

  if (!filteredResults || filteredResults.length === 0) {
    return (
      <div className="restricted-chat">
        <p>No filtered results found.</p>
        <p>Please go to <a href="/connections">User Connections</a> to set your preferences and find potential matches.</p>
      </div>
    );
  }

  const canChat = filteredResults.some((u) => u.id === otherUserId);

  if (!canChat) {
    return (
      <div className="restricted-chat">
        <p>You do not have access to chat with this user.</p>
        <p>This user is not in your current filtered results. Please update your preferences in <a href="/connections">User Connections</a> if you&apos;d like to connect with different matches.</p>
      </div>
    );
  }

  return <Chat />;
};

export default ProtectedChat;