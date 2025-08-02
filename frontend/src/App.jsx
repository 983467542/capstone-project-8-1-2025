// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { restoreCSRF } from './store/csrf';
import Navigation from './components/Navigation/Navigation';
import LandingPage from './components/LandingPage/LandingPage';
import UserProfile from './components/UserProfile/UserProfile';
import UserConnections from './components/UserConnections/UserConnections';
// import GuessingGame from './components/GuessingGame/GuessingGame';
import GamePlay from './components/GamePlay/GamePlay';
import GameStart from './components/GameStart/GameStart';
import ProtectedConnectionProfile from './components/ConnectionProfile/ProtectedConnectionProfile';
import ProtectedChat from './components/Chat/ProtectedChat';
import ChatMessagesIntro from './components/Chat/ChatMessagesIntro';
import * as sessionActions from './store/session';
import ProtectedRoute from "./utils/ProtectedRoute";

function Layout() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    restoreCSRF();
  }, []);

  useEffect(() => {
    dispatch(sessionActions.restoreUser())
      .then(() => setIsLoaded(true))
      .catch(() => setIsLoaded(true));
  }, [dispatch]);

  return (
    <>
      <Navigation isLoaded={isLoaded} />
      {isLoaded && <Outlet />}
    </>
  );
}

// function GameWrapper() {
//   const { gamePlayId } = useParams();
//   return gamePlayId ? <GuessingGame gamePlayId={gamePlayId} /> : <div>Game not found</div>;
// }

// function GameWrapper() {
//   const { gamePlayId } = useParams();
//   return gamePlayId ? <GamePlay gamePlayId={gamePlayId} /> : <div>Game not found</div>;
// }

// function GameWrapper() {
//   const { gameSessionId } = useParams();
//   return gameSessionId ? <GamePlay gameSessionId={gameSessionId} /> : <div>Game not found</div>;
// }

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        path: '/profile', element: (
          <ProtectedRoute> <UserProfile /> </ProtectedRoute>
        ),
      },
      {
        path: '/connection-profile/:userId', element: (
          <ProtectedRoute> <ProtectedConnectionProfile /> </ProtectedRoute>
        ),
      },
      {
        path: '/connections', element: (
          <ProtectedRoute> <UserConnections /> </ProtectedRoute>
        ),
      },
      { path: '/chat-messages', element: <ChatMessagesIntro /> },
      {
        path: '/chat-messages/:user1Id/:user2Id',
        element: <ProtectedChat />
      },
      { path: '/game-plays/:user1Id/:user2Id', element: <GamePlay /> },
      // { path: '/game-plays/:gamePlayId', element: <GameWrapper /> },
      // { path: '/game-plays/:gameSessionId', element: <GameWrapper /> },
      // { path: '/game-plays/:gamePlayId', element: <GamePlay /> },
      // { path: '/game-plays/:gameSessionId', element: <GamePlay /> },
      // { path: '/game-plays', element: <GamePlay /> },
      //       {
      //   path: '/guess-me-game', element: (
      //     <ProtectedRoute> <GamePlay /> </ProtectedRoute>
      //   ),
      // },
      // {
      //   path: '/guess-me-game', element: (
      //     <ProtectedRoute> <GuessingGame /> </ProtectedRoute>
      //   ),
      // },
      { path: '/game-start', element: <GameStart /> },
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;