import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getAvailableUsers } from '../../store/users';
import { startGame, setGame, getGameByUsers, getUserGamePlays } from '../../store/game-plays';
import UseState from '../UseState/UseState';
import './GameStart.css';

const GameStart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user1Id, user2Id } = useParams();

  const sessionUser = useSelector(state => state.session.user);
  const availableUsers = useSelector(state => state.users.availableUsers || []);
  const gamePlays = useSelector(state => state.gamePlays.gamePlays || []);
  const { loading, error } = useSelector(state => state.gamePlays);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [errorMessage, setErrorMessage] = useState('');
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [addedUser, setAddedUser] = useState(null);

  useEffect(() => {
    if (sessionUser) {
      dispatch(getAvailableUsers());
      dispatch(getUserGamePlays());
    }
  }, [sessionUser, dispatch]);

  useEffect(() => {
    if (user1Id && user2Id) {
      dispatch(getGameByUsers(user1Id, user2Id));
    } else {
      dispatch(getUserGamePlays());
    }
  }, [dispatch, user1Id, user2Id]);

  if (!sessionUser) return <Navigate to="/" />;

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    const trimmedName = newPlayerName?.trim();
    if (!trimmedName) {
      setErrorMessage("No player name entered.");
      return;
    }

    const userToAdd = availableUsers?.find(user => user.username === trimmedName);
    if (!userToAdd) {
      setErrorMessage("No user found with that username.");
      return;
    }

    if (players.includes(trimmedName)) {
      setErrorMessage("Player already added.");
      return;
    }

    setErrorMessage('');
    setAddedUser(userToAdd);
    setPlayers([...players, trimmedName]);
    setNewPlayerName('');
    setShowAddPlayerForm(false);

    const existingGame = gamePlays.find(
      (game) =>
        (game.user_1_id === sessionUser.id && game.user_2_id === userToAdd.id) ||
        (game.user_2_id === sessionUser.id && game.user_1_id === userToAdd.id)
    );

    if (existingGame) {
      dispatch(setGame(existingGame));
      navigate(`/game-plays/${existingGame.user_1_id}/${existingGame.user_2_id}`);
    }
  };

  const handleStartGame = async () => {
    setErrorMessage('');

    if (!sessionUser) {
      setErrorMessage('You must be logged in to play');
      return;
    }

    if (!addedUser?.id) {
      setErrorMessage('Please add a player first before starting the game.');
      return;
    }

    const existingGame = gamePlays.find(
      (game) =>
        (game.user_1_id === sessionUser.id && game.user_2_id === addedUser.id) ||
        (game.user_2_id === sessionUser.id && game.user_1_id === addedUser.id)
    );

    if (existingGame) {
      dispatch(setGame(existingGame));
      navigate(`/game-plays/${existingGame.user_1_id}/${existingGame.user_2_id}`);
      return;
    }

    try {
      const gameData = await dispatch(startGame({
        user_1_id: sessionUser.id,
        user_2_id: addedUser.id,
      }));

      if (gameData && gameData.user_1_id && gameData.user_2_id) {
        dispatch(setGame(gameData));
        navigate(`/game-plays/${gameData.user_1_id}/${gameData.user_2_id}`);
      } else if (gameData) {
        navigate(`/game-plays/${sessionUser.id}/${addedUser.id}`);
      } else {
        // setErrorMessage('Failed to create game');
        setErrorMessage('Could not start the game because there is no confirmed meeting found between the users.');
      }
    } catch (err) {
      console.error('Failed to start game:', err);
      setErrorMessage(`Could not start a new game: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      <div className={`header ${theme}`}>
        <UseState setTheme={setTheme} />
        <h1>Start a Game</h1>
      </div>

      <div className="game-play-cards">
        <div className={`list-of-users-with-active-game ${theme}`}>
          {gamePlays.length === 0 ? (
            <p>No active games found.</p>
          ) : (
            gamePlays.map(g => {
              const opponent = g.user1?.id === sessionUser.id ? g.user2 : g.user1;
              return (
                <div key={`game-${g.gameSessionId}`}>
                  <button
                    onClick={() => navigate(`/game-plays/${g.user_1_id}/${g.user_2_id}`)}
                    className={`game-play-rounded-rectangular-button ${theme}`}
                  >
                    Continue game with {opponent?.username || 'Unknown User'}
                  </button>
                </div>
              );
            })
          )}

          <div className="new-game-section">
            <h2>Start New Game</h2>

            <div>
              <p><strong>To start a new game:</strong></p>
              <p>1. Click on the Add Player button.</p>
              <p>2. Type the username of a user.</p>
              <p>3. Click on the Add button then the Start Game button.</p>
            </div>

            <div className="player-management">
              <div className="player-list">
                {addedUser && (
                  <p><strong>Selected player to add:</strong> {addedUser.username}</p>
                )}
              </div>

              <div className="player-buttons">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerForm(!showAddPlayerForm)}
                  className={`game-play-rounded-rectangular-button ${theme}`}
                >
                  {showAddPlayerForm ? "Cancel" : "Add Player"}
                </button>

                {showAddPlayerForm && (
                  <form
                    onSubmit={handleAddPlayer}
                    className="add-player-form"
                  >
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Enter player username"
                      required
                    />
                    <button type="submit" className={`game-play-rounded-rectangular-button ${theme}`}>
                      Add
                    </button>
                  </form>
                )}
              </div>
            </div>

            <button
              type="button"
              className={`game-play-rounded-rectangular-button ${theme}`}
              onClick={handleStartGame}
            >
              {loading ? 'Starting Game...' : 'Start Game'}
            </button>
          </div>

          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-message">
              Creating game session...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameStart;
