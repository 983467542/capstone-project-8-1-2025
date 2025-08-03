// frontend/src/components/ConnectionProfile/ConnectionProfile.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllConnections,
  addConnection,
  getConnection,
  updateMeetingStatus,
  updateConnectionStatus,
  updateFeedback,
  updateConnection
} from '../../store/user-connections';
import { restoreUser } from '../../store/session';
import { startGame } from '../../store/game-plays';
import './ConnectionProfile.css';
import '../UseState/UseState.css';
import UseState from '../UseState/UseState';

function ConnectionProfile() {
  const userConnectionsLoading = useSelector(state => state.userConnections.loading);
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [suggestedActivityInput, setSuggestedActivityInput] = useState('');
  const [meetingTimeInput, setMeetingTimeInput] = useState('');
  const [activityError, setActivityError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [statusType, setStatusType] = useState('');
  const [sessionUsername, setSessionUsername] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const profileFetched = useRef(false);
  const connectionFetched = useRef(false);

  const userIdNumber = Number(userId);
  const currentUserId = useSelector(state => state.session.user?.id);
  const sessionUser = useSelector(state => state.session.user);
  const { loading: gameLoading } = useSelector((state) => state.gamePlays);
  const connection = useSelector((state) =>
    state.userConnections?.connections.find((conn) =>
      (conn.user1?.id === currentUserId && conn.user2?.id === userIdNumber) ||
      (conn.user1?.id === userIdNumber && conn.user2?.id === currentUserId)
    )
  );

  const clearMessages = () => {
    setStatusMessage('');
    setMessage('');
  };

  const handleStartGame = async () => {
    clearMessages();
    setError(null);

    if (!sessionUser || !connection) {
      setError('You need a connection to start a game.');
      return;
    }

    const user1Confirmed = (connection.meetingStatusUser1 || '').toLowerCase().trim() === 'confirmed';
    const user2Confirmed = (connection.meetingStatusUser2 || '').toLowerCase().trim() === 'confirmed';

    if (!user1Confirmed || !user2Confirmed) {
      setError('Both users must confirm the meeting before starting a game.');
      return;
    }

    const user1Id = connection.user_1_id;
    const user2Id = connection.user_2_id;

    try {
      const game = await dispatch(startGame({ user_1_id: user1Id, user_2_id: user2Id }));
      if (!game) {
        setError('Failed to start game. Please try again.');
        return;
      }
      setMessage(`Game started with ${profile.username}`);
      navigate(`/game-plays/${user1Id}/${user2Id}`);
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game.');
    }
  };

  // const handleChat = async () => {
  // }

  useEffect(() => {
    if (!sessionUser) {
      dispatch(restoreUser());
    }
  }, [dispatch, sessionUser]);

  useEffect(() => {
    dispatch(fetchAllConnections());
  }, [dispatch]);

  useEffect(() => {
    if (!connection) return;

    const isUser1 = connection.user1?.id === currentUserId;

    const suggestedActivity = isUser1
      ? connection.suggestedActivityUser1
      : connection.suggestedActivityUser2;

    const meetingTime = isUser1
      ? connection.meetingTimeUser1
      : connection.meetingTimeUser2;

    setSuggestedActivityInput(suggestedActivity || '');

    if (meetingTime) {
      const date = new Date(meetingTime);
      const localDateTimeString = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      setMeetingTimeInput(localDateTimeString(date));
    } else {
      setMeetingTimeInput('');
    }
  }, [connection, currentUserId]);

  useEffect(() => {
    const fetchSessionUsername = async () => {
      try {
        const res = await fetch(`/api/users/${sessionUser.id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSessionUsername(data.username);
        }
      } catch (err) {
        console.error('Failed to fetch session user details:', err);
      }
    };

    if (sessionUser?.id) fetchSessionUsername();
  }, [sessionUser?.id]);

  useEffect(() => {
    if (userId && !profileFetched.current) {
      profileFetched.current = true;

      const fetchProfile = async () => {
        try {
          const profileRes = await fetch(`/api/users/${userId}`, { credentials: 'include' });
          if (profileRes.ok) {
            const data = await profileRes.json();
            setProfile(data);
            setStatusMessage('');
          } else {
            throw new Error('Failed to load profile');
          }
        } catch (err) {
          console.error(err);
          setStatusMessage(err.message);
          setStatusType('error');
        }
      };

      fetchProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && !connectionFetched.current) {
      connectionFetched.current = true;
      dispatch(getConnection(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (connection) {
      if (connection.suggestedActivity) {
        setSuggestedActivityInput(connection.suggestedActivity);
      }
      const localDateTimeString = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      if (connection.meetingTime) {
        const date = new Date(connection.meetingTime);
        setMeetingTimeInput(localDateTimeString(date));
      }
    }
  }, [connection]);

  const handleAcceptConnection = async () => {
    clearMessages();
    setError(null);
    if (connection) {
      try {
        const statusField = currentUserId === connection.user_1_id
          ? { connectionStatusUser1: 'accepted' }
          : { connectionStatusUser2: 'accepted' };

        await dispatch(updateConnectionStatus(connection.id, statusField));
        setMessage('Connection accepted.');
        await dispatch(getConnection(userId));
      } catch (err) {
        console.error('Error accepting connection:', err);
        setError('Failed to accept connection.');
      }
    } else {
      setError('No connection found for this user. Type a suggested activity and select a meeting time, click on the Want to Meet button, then click on the Accept Connection button');
    }
  };

  const handleDeclineConnection = async () => {
    clearMessages();
    setError(null);
    if (connection) {
      try {
        const statusField = currentUserId === connection.user_1_id
          ? { connectionStatusUser1: 'declined' }
          : { connectionStatusUser2: 'declined' };

        await dispatch(updateConnectionStatus(connection.id, statusField));
        setMessage('Connection declined.');
        await dispatch(getConnection(userId));
      } catch (err) {
        console.error('Error declining connection:', err);
        setError('Failed to decline connection.');
      }
    } else {
      setError('No connection found to decline. Type a suggested activity and select a meeting time, click on the Want to Meet button, click on the Accept Connection button, then click on the Decline Connection button.');
    }
  };

  const handleCancelRequest = async () => {
    clearMessages();
    setError(null);
    if (!connection) {
      setError('No connection request to cancel.');
      return;
    }
    const isUser1 = currentUserId === connection.user_1_id;

    const activity = isUser1 ? connection.suggestedActivityUser1 : connection.suggestedActivityUser2;
    const time = isUser1 ? connection.meetingTimeUser1 : connection.meetingTimeUser2;

    if (!activity || !time) {
      setError('Type a suggested activity and select a meeting time, click on the Want to Meet button, then click on the Cancel Request button.');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to cancel the connection request?');
    if (!confirmed) return;
    try {
      const payload = {
        id: connection.id,
        ...(isUser1
          ? {
            suggestedActivityUser1: null,
            meetingTimeUser1: null,
            connectionStatusUser1: 'pending'
          }
          : {
            suggestedActivityUser2: null,
            meetingTimeUser2: null,
            connectionStatusUser2: 'pending'
          }),
      };

      await dispatch(updateConnection(payload));
      await dispatch(getConnection(userId));
      setMessage('Connection request canceled.');

      setSuggestedActivityInput('');
      setMeetingTimeInput('');
    } catch (err) {
      console.error('Error canceling connection request:', err);
      setError('Failed to cancel the connection request.');
    }
  };

  const handleWantToMeet = async () => {
    clearMessages();
    setError(null);
    const user2Id = parseInt(userId);
    const suggestedActivity = suggestedActivityInput.trim();
    const rawDate = new Date(meetingTimeInput);
    let hasError = false;

    setActivityError('');
    setTimeError('');

    if (!suggestedActivity || suggestedActivity.length < 3) {
      setActivityError("Please enter a valid activity (at least 3 characters).");
      hasError = true;
    }

    if (isNaN(rawDate.getTime())) {
      setTimeError("Please select a valid meeting time.");
      hasError = true;
    }

    if (hasError) return;

    const meetingTime = rawDate.toISOString();

    const payload = {
      user2Id,
    };

    if (!connection) {
      payload.suggestedActivityUser1 = suggestedActivity;
      payload.meetingTimeUser1 = meetingTime;
    } else {
      if (currentUserId === connection.user_1_id) {
        payload.suggestedActivityUser1 = suggestedActivity;
        payload.meetingTimeUser1 = meetingTime;
      } else {
        payload.suggestedActivityUser2 = suggestedActivity;
        payload.meetingTimeUser2 = meetingTime;
      }
    }

    try {
      if (!connection || connection.connectionStatus === 'pending') {
        await dispatch(addConnection(payload, (errMsg) => setStatusMessage(errMsg)));
        setMessage('Connection request sent!');
      } else {
        payload.id = connection.id;
        await dispatch(updateConnection(payload, (errMsg) => setStatusMessage(errMsg)));
        setMessage('Connection requested.');
        setSuggestedActivityInput(suggestedActivity);
        setMeetingTimeInput(meetingTimeInput);
        await dispatch(getConnection(userId));
      }

      setSuggestedActivityInput('');
      setMeetingTimeInput('');
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError('Failed to send connection request.');
    }
  };

  const handleConfirmMeeting = async () => {
    clearMessages();
    setError(null);
    if (!connection) {
      setError('No connection found for this user. Type a suggested activity and select a meeting time, click on the Want to Meet button, then click on the Accept Connection button.');
      return;
    }
    if (connection && sessionUser) {
      const statusKey =
        sessionUser.id === connection.user_1_id ? 'meetingStatusUser1' : 'meetingStatusUser2';
      try {
        const payload = { [statusKey]: 'confirmed' };
        await dispatch(updateMeetingStatus(connection.id, payload));
        setMessage('Meeting confirmed.');
        await dispatch(getConnection(userId));
      } catch (err) {
        console.error('Error confirming meeting:', err);
        setError('Failed to confirm meeting.');
      }
    }
  };

  const handleMeetAgain = async () => {
    clearMessages();
    setError(null);
    if (!connection) {
      setError('No connection found for this user. Type a suggested activity and select a meeting time, click on the Want to Meet button, click on the Accept Connection button, then click on the Confirm Meeting button or the Cancel Meeting button.');
      return;
    }
    if (connection) {
      try {
        await dispatch(updateFeedback(connection.id, true));
        setMessage('Your interest in meeting again has been noted.');
        await dispatch(getConnection(userId));
      } catch (err) {
        console.error('Error updating feedback:', err);
        setError('Failed to update feedback.');
      }
    }
  };

  const handleNeverMeetAgain = async () => {
    clearMessages();
    setError(null);
    if (!connection) {
      setError('No connection found for this user. Type a suggested activity and select a meeting time, click on the Want to Meet button, click on the Accept Connection button, then click on the Confirm Meeting button or the Cancel Meeting button.');
      return;
    }

    const feedbackKey =
      currentUserId === connection.user_1_id
        ? 'meetAgainChoiceUser1'
        : 'meetAgainChoiceUser2';

    if (!connection[feedbackKey]) {
      setError('Click on the Meet Again button then click on the Never Meet Again button.');
      return;
    }

    try {
      const statusField =
        currentUserId === connection.user_1_id
          ? { connectionStatusUser1: 'declined' }
          : { connectionStatusUser2: 'declined' };

      await dispatch(updateConnectionStatus(connection.id, statusField));
      await dispatch(updateFeedback(connection.id, false));
      setMessage('You have chosen to never meet again. Connection removed.');
      await dispatch(getConnection(userId));
    } catch (err) {
      console.error('Error choosing to never meet again and removing connection:', err);
      setError('Failed to choose to never meet again and remove connection.');
    }
  };

  const handleUndoMeetAgainOrNeverMeetAgain = async () => {
    clearMessages();
    setError(null);
    if (!connection) {
      setError('No connection found for this user. Type a suggested activity and select a meeting time, click on the Want to Meet button, click on the Accept Connection button, click on the Confirm Meeting button or the Cancel Meeting button, then click on the Meet Again button or the Never Meet Again button.');
      return;
    }
    if (connection && sessionUser) {
      const isUser1 = sessionUser.id === connection.user_1_id;
      const feedbackField = isUser1 ? 'meetAgainChoiceUser1' : 'meetAgainChoiceUser2';

      try {

        await dispatch(updateFeedback(connection.id, null, feedbackField));
        setMessage('Your meet again choice has been reset.');
        await dispatch(getConnection(userId));
      } catch (err) {
        console.error('Error undoing meet again/never meet again:', err);
        setError('Failed to undo feedback.');
      }
    }
  };

  const handleCancelMeeting = async () => {
    clearMessages();
    setError(null);
    if (!connection) {
      setError('No connection found for this user. Type a suggested activity and select a meeting time, click on the Want to Meet button, then click on the Accept Connection button.');
      return;
    }
    if (connection && sessionUser) {
      const statusKey = sessionUser.id === connection.user_1_id
        ? 'meetingStatusUser1'
        : 'meetingStatusUser2';

      const currentStatus = connection[statusKey];

      if (currentStatus !== 'confirmed') {
        setError('You can only cancel a meeting that has been confirmed.');
        return;
      }

      const confirmed = window.confirm('Are you sure you want to cancel the meeting?');
      if (!confirmed) return;

      try {
        await dispatch(updateMeetingStatus(connection.id, { [statusKey]: 'canceled' }));
        setMessage('Meeting has been canceled.');
        await dispatch(getConnection(userId));
      } catch (err) {
        console.error('Error canceling meeting:', err);
        setError('Failed to cancel the meeting.');
      }
    }
  };

  const handleUndoConfirmingOrCancelingMeeting = async () => {
    clearMessages();
    setError(null);
    if (!connection) {
      setError('No connection found for this user. Type a suggested activity and select a meeting time, click on the Want to Meet button, click on the Accept Connection button, then click on the Confirm Meeting button or the Cancel Meeting button.');
      return;
    }
    if (connection && sessionUser) {
      const statusKey =
        sessionUser.id === connection.user_1_id ? 'meetingStatusUser1' : 'meetingStatusUser2';
      try {
        await dispatch(updateMeetingStatus(connection.id, { [statusKey]: 'pending' }));
        setMessage('Your meeting status has been reset.');
        await dispatch(getConnection(userId));
      } catch (err) {
        console.error('Error undoing meeting confirmation/cancellation:', err);
        setError('Failed to undo meeting status.');
      }
    }
  };

  const isCurrentUserUser1 = connection?.user1?.id === currentUserId;
  const mySuggestedActivity = isCurrentUserUser1
    ? connection?.suggestedActivityUser1 || 'No activity suggested'
    : connection?.suggestedActivityUser2 || 'No activity suggested';

  const theirSuggestedActivity = isCurrentUserUser1
    ? connection?.suggestedActivityUser2
    : connection?.suggestedActivityUser1;

  const myMeetingTime = isCurrentUserUser1
    ? connection?.meetingTimeUser1
    : connection?.meetingTimeUser2;

  const theirMeetingTime = isCurrentUserUser1
    ? connection?.meetingTimeUser2
    : connection?.meetingTimeUser1;

  const myConnectionStatus = isCurrentUserUser1
    ? connection?.connectionStatusUser1
    : connection?.connectionStatusUser2;

  const theirConnectionStatus = isCurrentUserUser1
    ? connection?.connectionStatusUser2
    : connection?.connectionStatusUser1;

  const myMeetingStatus = isCurrentUserUser1
    ? connection?.meetingStatusUser1
    : connection?.meetingStatusUser2;

  const theirMeetingStatus = isCurrentUserUser1
    ? connection?.meetingStatusUser2
    : connection?.meetingStatusUser1;

  const myMeetAgainChoice = isCurrentUserUser1
    ? connection?.meetAgainChoiceUser1
    : connection?.meetAgainChoiceUser2;

  const theirMeetAgainChoice = isCurrentUserUser1
    ? connection?.meetAgainChoiceUser2
    : connection?.meetAgainChoiceUser1;

  if (userConnectionsLoading) return <p>Loading connection...</p>;
  if (!profile) return <p>Loading...</p>;
  if (!sessionUser) return <p>Loading session user...</p>;

  return (
    <div className={`connection-profile-header ${theme}`}>
      <UseState setTheme={setTheme} />

      {gameLoading && <p>Starting game...</p>}
      {error && <p>Error: {error}</p>}

      <div className={`connection-profile-wrapper ${theme}`}>
        <h1 className={`connection-profile-h1 ${theme}`}>
          {profile.firstName || profile.username}
        </h1>
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Age:</strong> {profile.age || 'Not added yet'}</p>
        <p><strong>Ethnicity/Ethnicities:</strong> {profile.ethnicity || 'Undisclosed'}</p>
        <p><strong>Interests:</strong> {profile.interests || 'Not added yet'}</p>
        <p><strong>Objectives:</strong> {profile.objectives || 'Not added yet'}</p>
        <p><strong>Bio:</strong> {profile.bio || 'Not added yet'}</p>
        <br />

        {connection && (
          <>
            <p>
              You ({sessionUsername || 'You'}){' '}
              {mySuggestedActivity
                ? `suggested this activity: ${mySuggestedActivity}`
                : 'have not suggested an activity.'}
            </p>

            <p>
              You ({sessionUsername || 'You'}){' '}
              {myMeetingTime
                ? `suggested this meeting time: ${new Date(myMeetingTime).toLocaleString()}`
                : 'have not suggested a meeting time.'}
            </p>

            <p>
              You ({sessionUsername || 'You'}){' '}
              {myConnectionStatus === 'declined'
                ? `removed ${profile.username} as a connection.`
                : myConnectionStatus === 'accepted'
                  ? `added ${profile.username} as a connection.`
                  : `have not added ${profile.username} as a connection.`}
            </p>

            <p>
              You ({sessionUsername || 'You'}){' '}
              {myMeetingStatus === 'canceled'
                ? `have canceled a meeting with ${profile.username}.`
                : myMeetingStatus === 'confirmed'
                  ? `have confirmed a meeting with ${profile.username}.`
                  : `have not confirmed or canceled a meeting with ${profile.username}.`}
            </p>

            <p>
              You ({sessionUsername || 'You'}){' '}
              {myMeetAgainChoice === true
                ? 'have chosen to meet again.'
                : myMeetAgainChoice === false
                  ? 'have chosen to not meet again.'
                  : 'have not decided to meet again or not meet again.'}
            </p>

            <p>
              {profile?.username || 'The other user'}{' '}
              {theirSuggestedActivity
                ? `suggested this activity: ${theirSuggestedActivity}`
                : 'has not suggested an activity.'}
            </p>

            <p>
              {profile?.username || 'The other user'}{' '}
              {theirMeetingTime
                ? `suggested this meeting time: ${new Date(theirMeetingTime).toLocaleString()}`
                : 'has not suggested a meeting time.'}
            </p>

            <p>
              {profile?.username || 'The other user'}{' '}
              {theirConnectionStatus === 'declined'
                ? 'removed you as a connection.'
                : theirConnectionStatus === 'accepted'
                  ? 'added you as a connection.'
                  : 'has not added you as a connection.'}
            </p>

            <p>
              {profile?.username || 'The other user'}{' '}
              {theirMeetingStatus === 'canceled'
                ? 'has canceled a meeting with you.'
                : theirMeetingStatus === 'confirmed'
                  ? 'has confirmed a meeting with you.'
                  : 'has not confirmed or canceled a meeting with you.'}
            </p>

            <p>
              {profile?.username || 'The other user'}{' '}
              {theirMeetAgainChoice === true
                ? 'has chosen to meet again.'
                : theirMeetAgainChoice === false
                  ? 'has chosen to not meet again.'
                  : 'has not decided to meet again or not meet again.'}
            </p>
            <br />
          </>
        )}

        <p><strong>List of Activities:</strong></p>
        <p><strong>Map of Places Based on Location Radius</strong></p>
        < br />
        < br />
        < br />
        < br />

        <div className="form-group">
          {activityError && <p style={{ color: 'red', marginBottom: '4px' }}>{activityError}</p>}
          <label>
            <strong>
              Suggested Activity:
            </strong>
            <input
              type="text" className="connection-profile-input"
              value={suggestedActivityInput}
              onChange={(e) => {
                setSuggestedActivityInput(e.target.value);
                setStatusMessage('');
                setActivityError('');
              }}
              placeholder="e.g., Coffee chat"
            />
          </label>
        </div>

        <div className="form-group">
          {timeError && <p style={{ color: 'red', marginBottom: '4px' }}>{timeError}</p>}
          <label>
            <strong>
              Meeting Time:
            </strong>
            <input
              type="datetime-local" className="connection-profile-input"
              value={meetingTimeInput}
              onChange={(e) => {
                setMeetingTimeInput(e.target.value);
                setStatusMessage('');
                setTimeError('');
              }}
            />
          </label>
        </div>

        {statusMessage && (
          <p style={{ color: statusType === 'error' ? 'black' : 'black' }}>
            {statusMessage}
          </p>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleWantToMeet}>Want to Meet</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleCancelRequest}>Cancel Request</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleAcceptConnection}>Accept Connection</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleDeclineConnection}>Decline Connection</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleConfirmMeeting}>Confirm Meeting</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleCancelMeeting}>Cancel Meeting</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`}
          onClick={handleUndoConfirmingOrCancelingMeeting}
        >
          Undo Confirming or Canceling Meeting
        </button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleMeetAgain}>Meet Again</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`} onClick={handleNeverMeetAgain}>Never Meet Again</button>
        <button type="button" className={`connection-profile-rounded-rectangular-button ${theme}`}
          onClick={handleUndoMeetAgainOrNeverMeetAgain}
        >
          Undo Meet Again or Never Meet Again
        </button>
        {/* <button disabled>Connection already exists</button> */}
        <br />
        <br />
        <div>
          <button
            type="button"
            className={`connection-profile-rounded-rectangular-button ${theme}`}
            onClick={handleStartGame}
          >
            Start Game
          </button>
          <button type="button"
            className={`connection-profile-rounded-rectangular-button ${theme}`}
            onClick={() => alert("Feature coming soon")}
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConnectionProfile;
