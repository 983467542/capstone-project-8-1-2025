// frontend/src/store/game-plays.js
import { csrfFetch } from '../store/csrf';

// Action Types
const START_GAME = 'START_GAME';
const GET_USER_GAME_PLAYS = 'GET_USER_GAME_PLAYS';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_GAME = 'SET_GAME';
const UPDATE_GAME_TRAIT = 'UPDATE_GAME_TRAIT';
const UPDATE_GUESSED_VALUE = 'UPDATE_GUESSED_VALUE';
const UPDATE_GAME_SUCCESS = 'UPDATE_GAME_SUCCESS';
const RESET_GAME_STATE = 'RESET_GAME_STATE';
const UPDATE_GAME_STATE = 'UPDATE_GAME_STATE';
const GET_INDIVIDUAL_GAME = 'GET_INDIVIDUAL_GAME';
const GET_GAME_BY_USERS = 'GET_GAME_BY_USERS';

const normalizeGameData = (game) => {
  if (!game) return game;

  return {
    ...game,
    players: Array.isArray(game.players)
      ? game.players
      : typeof game.players === 'string'
        ? JSON.parse(game.players)
        : [],
    usedCards: Array.isArray(game.usedCards)
      ? game.usedCards
      : typeof game.usedCards === 'string'
        ? JSON.parse(game.usedCards)
        : [],
    completedTraits: Array.isArray(game.completedTraits)
      ? game.completedTraits
      : typeof game.completedTraits === 'string'
        ? JSON.parse(game.completedTraits)
        : []
  };
};

// Action Creators
export const setLoading = (isLoading) => ({
  type: SET_LOADING,
  payload: isLoading,
});

export const setError = (error) => ({
  type: SET_ERROR,
  payload: error,
});

// export const setGame = (game) => {
//   const { guesser } = game || {};
//   if (guesser) {
//     console.log('Guesser (id + username only):', {
//       id: guesser.id,
//       username: guesser.username
//     });
//   }
//   return {
//     type: SET_GAME,
//     game,
//   };
// };
export const setGame = (game) => ({
  type: SET_GAME,
  game,
});

export const resetGameState = () => ({
  type: RESET_GAME_STATE
});

// Thunk Action Creators
export const startGame = ({ user_1_id, user_2_id }) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await csrfFetch('/game-plays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_1_id,
        user_2_id,
        traitCategory: null,
        traitName: null,
        interactionType: "guessing",
        players: [],
        currentPlayerIndex: 0,
        roundNumber: 1,
        usedCards: [],
        completedTraits: [],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      dispatch(setError(data?.error || 'Failed to start game'));
      return null;
    }

    if (typeof data.players === 'string') {
      try {
        data.players = JSON.parse(data.players);
      } catch {
        data.players = [];
      }
    }
    dispatch(setGame(data));
    dispatch({
      type: START_GAME,
      payload: data,
    });
    return data;
  } catch (error) {
    dispatch(setError(error.message || 'You can only start a game if you and another user have confirmed a meeting with each other.'));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getUserGamePlays = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await csrfFetch('/game-plays');
    if (!res.ok) throw new Error('Failed to fetch user game plays');

    const data = await res.json();
    dispatch({
      type: GET_USER_GAME_PLAYS,
      payload: data
    });
    return data;
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateGameState = (gameSessionId, updates) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await csrfFetch(`/game-plays/${gameSessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    const updatedGame = await res.json();
    dispatch({
      type: UPDATE_GAME_STATE,
      payload: updatedGame
    });
    dispatch(setGame(updatedGame));
    return updatedGame;
  } catch (error) {
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateGameTrait = (gamePlayId, traitData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const cleanTraitData = Object.fromEntries(
      Object.entries(traitData).filter(([, value]) => value !== undefined)
    );
    const res = await csrfFetch(`/game-plays/${gamePlayId}/trait`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanTraitData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      // console.error('Error response:', errorText);
      throw new Error(`Failed to update game trait: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    dispatch({
      type: UPDATE_GAME_TRAIT,
      payload: data
    });
    dispatch(setGame(data));
    return data;
  } catch (error) {
    // console.error('Error in updateGameTrait:', error);
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateGuessedValue = (gamePlayId, guessedValue) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await csrfFetch(`/game-plays/${gamePlayId}/guessed-value`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guessedValue }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      // console.error('Error response:', errorText);
      throw new Error(`Failed to update guessed value: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    dispatch({
      type: UPDATE_GUESSED_VALUE,
      payload: data
    });
    dispatch(setGame(data));
    return data;
  } catch (error) {
    // console.error('Error in updateGuessedValue:', error);
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateGameCorrectness = (gamePlayId, data) => async (dispatch) => {
  // dispatch({ type: UPDATE_GAME_CORRECTNESS });
  dispatch(setLoading(true));
  try {
    const response = await csrfFetch(`/game-plays/${gamePlayId}/correctness`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update game correctness');
    }

    const updatedGame = await response.json();
    dispatch({
      type: UPDATE_GAME_SUCCESS,
      payload: updatedGame,
    });
    dispatch(setGame(updatedGame));
    return updatedGame;
  } catch (error) {
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateGameInteractionType = (gamePlayId, data) => async (dispatch) => {
  // dispatch({ type: UPDATE_GAME_INTERACTION_TYPE });
  dispatch(setLoading(true));
  try {
    const response = await csrfFetch(`/game-plays/${gamePlayId}/interaction-type`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update interaction type');
    }

    const updatedGame = await response.json();
    dispatch({
      type: UPDATE_GAME_SUCCESS,
      payload: updatedGame,
    });
    dispatch(setGame(updatedGame));
    return updatedGame;
  } catch (error) {
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const endGame = (gamePlayId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await csrfFetch(`/game-plays/${gamePlayId}/end`, {
      method: 'PUT',
    });

    if (!res.ok) throw new Error('Failed to end game');

    const data = await res.json();
    dispatch({
      type: UPDATE_GAME_SUCCESS,
      payload: data
    });
    dispatch(setGame(data));
    return data;
  } catch (error) {
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const resetFullGame = (gameSessionId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await csrfFetch(`/game-plays/${gameSessionId}/reset`, {
      method: 'PUT'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to reset game');
    }

    const updatedGame = await res.json();
    dispatch(setGame(updatedGame));
    return updatedGame;
  } catch (error) {
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getGameByUsers = (user1Id, user2Id) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await csrfFetch(`/game-plays/${user1Id}/${user2Id}`);

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch game');
    }

    const data = await res.json();
    dispatch({
      type: GET_INDIVIDUAL_GAME,
      payload: normalizeGameData(data)
    });

    return data;
  } catch (error) {
    console.error('Error fetching game by users:', error);
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Initial State
const initialState = {
  gamePlays: [],
  currentGamePlay: null,
  loading: false,
  error: null,
  game: null,
};

// Reducer
const gamePlaysReducer = (state = initialState, action) => {
  // if (!action || typeof action.type !== 'string') return state;
  if (action.type.startsWith('@@redux/')) return state;

  switch (action.type) {
    case START_GAME: {
      const exists = state.gamePlays.some(g => g.gameSessionId === action.payload.gameSessionId);
      return {
        ...state,
        gamePlays: exists ? state.gamePlays : [...state.gamePlays, action.payload],
        game: action.payload,
        currentGamePlay: action.payload,
        error: null,
      };
    }
    case GET_USER_GAME_PLAYS:
      return {
        ...state,
        gamePlays: action.payload.map(normalizeGameData),
        game: state.game || null,
        loading: false,
        error: null,
      };
    case UPDATE_GAME_STATE: {
      const updatedPayload = action.payload;
      return {
        ...state,
        gamePlays: state.gamePlays.map((gamePlay) =>
          gamePlay.gameSessionId === updatedPayload.gameSessionId ? updatedPayload : gamePlay
        ),
        game: updatedPayload,
        currentGamePlay: updatedPayload,
        error: null,
      };
    }
    case UPDATE_GAME_TRAIT: {
      const updatedPayload = action.payload;
      return {
        ...state,
        gamePlays: state.gamePlays.map((gamePlay) =>
          gamePlay.gameSessionId === updatedPayload.gameSessionId ? updatedPayload : gamePlay
        ),
        game: updatedPayload,
        currentGamePlay: updatedPayload,
        error: null,
      };
    }
    case UPDATE_GUESSED_VALUE: {
      const updatedPayload = action.payload;
      return {
        ...state,
        gamePlays: state.gamePlays.map((gamePlay) =>
          gamePlay.gameSessionId === updatedPayload.gameSessionId ? updatedPayload : gamePlay
        ),
        game: state.game && state.game.gameSessionId === updatedPayload.gameSessionId
          ? updatedPayload
          : state.game,
        currentGamePlay: action.payload,
        error: null,
      };
    }
    case UPDATE_GAME_SUCCESS:
      return {
        ...state,
        game: action.payload,
        gamePlays: state.gamePlays.map((gamePlay) =>
          gamePlay.gameSessionId === action.payload.gameSessionId ? action.payload : gamePlay
        ),
        currentGamePlay: action.payload,
        loading: false,
        error: null,
      };
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    case SET_GAME: {
      const updatedGame = normalizeGameData(action.game);
      const updatedGamePlays = state.gamePlays.some(g => g.gameSessionId === updatedGame.gameSessionId)
        ? state.gamePlays.map(g => g.gameSessionId === updatedGame.gameSessionId ? updatedGame : g)
        : [...state.gamePlays, updatedGame];
      return {
        ...state,
        game: updatedGame,
        currentGamePlay: updatedGame,
        gamePlays: updatedGamePlays
      };
    }
    case RESET_GAME_STATE:
      return {
        ...state,
        game: null,
        gamePlays: [],
        loading: false,
        error: null
      };
    case GET_INDIVIDUAL_GAME:
      return {
        ...state,
        currentGamePlay: action.payload,
        game: action.payload,
        loading: false,
        error: null,
      };
    case GET_GAME_BY_USERS:
      return {
        ...state,
        currentGamePlay: action.payload,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

export default gamePlaysReducer;