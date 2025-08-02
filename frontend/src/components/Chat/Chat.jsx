// frontend/src/components/Chat/Chat.jsx
import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  sendMessage,
  editMessage,
  getChatHistory,
} from '../../store/chat-messages';
import { csrfFetch } from '../../store/csrf';
import './Chat.css';

const getFilteredUserIds = (userId) => {
  const results = localStorage.getItem(`filteredResults-${userId}`);
  if (!results) return null;
  return JSON.parse(results).map(user => user.id);
};

function Chat() {
  const dispatch = useDispatch();
  const { user1Id, user2Id } = useParams();
  const navigate = useNavigate();

  const currentUserId = useSelector((state) => state.session.user?.id);
  const sessionUser = useSelector((state) => state.session.user);

  const id1 = parseInt(user1Id, 10);
  const id2 = parseInt(user2Id, 10);
  const chatPartnerId = currentUserId === id1 ? id2 : id1;
  const reduxMessages = useSelector(
    (state) => state.chatMessages.messages?.[chatPartnerId] || []
  );

  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [error, setError] = useState(null);
  const [chatPartnerUsername, setChatPartnerUsername] = useState('');
  const [allowedToChat, setAllowedToChat] = useState(false);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newMessage.trim()) return;

    try {
      await dispatch(sendMessage({
        receiverId: chatPartnerId,
        content: newMessage.trim(),
      }));
      setNewMessage('');
    } catch (err) {
      console.error(err);
      setError('Failed to send message.');
    }
  };

  const handleEditMessage = async (messageId) => {
    setError(null);
    try {
      await dispatch(editMessage(messageId, { editedContent: editedMessage }));
      setEditingMessageId(null);
      setEditedMessage('');
    } catch (err) {
      console.error(err);
      setError('Could not edit message.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const msgToDelete = messages.find((msg) => msg.id === messageId);
      if (msgToDelete) {
        console.log('Original Message Before Deletion:', msgToDelete.content);
      }
      const res = await csrfFetch(`/chat-messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to delete:', errorData);
        setError('Could not delete message.');
        return;
      }

      const updatedMsg = await res.json();

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMsg.id ? updatedMsg : msg
        )
      );
    } catch (err) {
      console.error(err);
      setError('Could not delete message.');
    }
  };

  useEffect(() => {
    if (!sessionUser || !chatPartnerId) return;
    const allowedIds = getFilteredUserIds(sessionUser.id);
    setAllowedToChat(allowedIds === null || allowedIds.includes(chatPartnerId));
  }, [sessionUser, chatPartnerId]);

  useEffect(() => {
    if (!chatPartnerId) return;

    dispatch(getChatHistory(chatPartnerId)).catch((err) => {
      console.error(err);
      setError('Unable to load messages.');
    });

    const interval = setInterval(() => {
      dispatch(getChatHistory(chatPartnerId)).catch(console.error);
    }, 3000);

    return () => clearInterval(interval);
  }, [chatPartnerId, dispatch]);

  useEffect(() => {
    setMessages(reduxMessages);
  }, [reduxMessages]);

  useEffect(() => {
    const fetchChatPartner = async () => {
      try {
        const res = await fetch(`/api/users/${chatPartnerId}`);
        if (!res.ok) throw new Error('Failed to fetch user info');
        const userData = await res.json();
        if (!userData?.id) throw new Error('User not found');
        setChatPartnerUsername(userData.username);
      } catch (err) {
        console.error(err);
        navigate('/chats-messages');
      }
    };

    if (chatPartnerId) {
      fetchChatPartner();
    }
  }, [chatPartnerId, navigate]);

  if (!user1Id || !user2Id || !currentUserId) {
    return <div>Loading...</div>;
  }

  if (![id1, id2].includes(currentUserId)) {
    return <div>Unauthorized access</div>;
  }

  if (!sessionUser) {
    return <div>Loading user...</div>;
  }

  if (!allowedToChat) {
    return <div className="not-allowed-to-chat">You can only chat with users who match your connection filters.</div>;
  }

  const isParticipant = currentUserId === id1 || currentUserId === id2;
  if (!isParticipant) {
    return <div>You are not authorized to view this conversation.</div>;
  }

  return (
    <div className="chat-box-container">
      <div className="chat-box-outer-theme">
        <div className="chat-header">Chat with {chatPartnerUsername || '...'}</div>

        <div className="messages">
          {messages.map((msg) => (
            <div className="message-bubble" key={msg.id}>
              <div className="message-meta">{msg.sender?.username}</div>
              {editingMessageId === msg.id ? (
                <>
                  <textarea
                    className="edit-textarea"
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    rows={2}
                  />
                  <button type="button" onClick={() => handleEditMessage(msg.id)}>
                    Save
                  </button>
                  <button type="button" onClick={() => {
                    setEditingMessageId(null);
                    setEditedMessage('');
                  }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="message-content">
                    {msg.deleted
                      ? <em className="deleted-message">This message was deleted by {msg.deletedBy?.username || 'the user'}.</em>
                      : (msg.revisions?.[0]?.editedContent || msg.content)
                    }
                  </div>
                  {msg.senderId === sessionUser.id && (
                    <div className="message-actions">
                      {!msg.deleted && msg.senderId === sessionUser.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditedMessage(msg.revisions?.[0]?.editedContent || msg.content);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="timestamp">
                {new Date(msg.createdAt).toLocaleString()}
                {msg.editedAt && ` (edited: ${new Date(msg.editedAt).toLocaleString()})`}
                {msg.deletedAt && ` (deleted: ${new Date(msg.deletedAt).toLocaleString()})`}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <textarea
            className="chat-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={2}
            placeholder="Type your message..."
          />
          <button className="send-button" type="submit" disabled={!newMessage.trim()}>
            Send
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        <button type="button" className="chat-connection-profile-rounded-rectangular-button"
          onClick={() => alert("Feature coming soon")}
        >
          Report
        </button>
        <button type="button" className="chat-connection-profile-rounded-rectangular-button"
          onClick={() => alert("Feature coming soon")}
        >
          Block
        </button>
      </div>
    </div>
  );
}

export default Chat;