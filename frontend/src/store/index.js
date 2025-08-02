// frontend/src/store/index.js
import { combineReducers } from 'redux';
import sessionReducer from './session';
import chatMessagesReducer from './chat-messages';
import gamePlaysReducer from './game-plays';
import userConnectionsReducer from './user-connections';
import usersReducer from './users';

const rootReducer = combineReducers({
  session: sessionReducer,
  chatMessages: chatMessagesReducer,
  gamePlays: gamePlaysReducer,
  userConnections: userConnectionsReducer,
  users: usersReducer
});

export default rootReducer;