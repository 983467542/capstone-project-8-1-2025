// frontend/src/components/Chat/ChatMessagesIntro.jsx
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink, Navigate } from 'react-router-dom';
import './ChatMessagesIntro.css';
import '../UseState/UseState.css';
import UseState from '../UseState/UseState';

function ChatMessagesIntro() {
    const sessionUser = useSelector((state) => state.session.user);
    const filteredResults = useSelector(state => state.userConnections.filteredResults || []);

    const [localFilteredResults, setLocalFilteredResults] = useState([]);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    useEffect(() => {
        function updateLocalFilteredResults() {
            if (sessionUser?.id) {
                const stored = localStorage.getItem(`filteredResults-${sessionUser.id}`);
                const results = stored ? JSON.parse(stored) : [];
                setLocalFilteredResults(results);
            }
        }

        updateLocalFilteredResults();

        const handleStorage = (event) => {
            if (event.key === `filteredResults-${sessionUser?.id}`) {
                updateLocalFilteredResults();
            }
        };

        const handleCustomEvent = () => updateLocalFilteredResults();

        window.addEventListener('storage', handleStorage);
        window.addEventListener('filteredResultsUpdated', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('filteredResultsUpdated', handleCustomEvent);
        };
    }, [sessionUser?.id]);

    if (!sessionUser) return <Navigate to="/" />;

    const resultsToShow = filteredResults.length > 0 ? filteredResults : localFilteredResults;

    return (
        <div>
            <div className={`header ${theme}`}>
                <UseState setTheme={setTheme} />
                <h1>My Chats</h1>
            </div>
            <div className={"chat-messages-intro-cards"}>
                <div className={`chat-messages-intro-wrapper ${theme}`}>
                    <p>
                        Select a user from your filtered results to start messaging
                    </p>
                    {resultsToShow.length === 0 ? (
                        <p>No filtered results yet. Go to <a href="/connections">Connections</a> to filter users.</p>
                    ) : (
                        <ul>
                            {resultsToShow.map((user) => {
                                if (!user?.id || !user?.username || user.id === sessionUser.id) {
                                    return null;
                                }

                                return (
                                    <li
                                        key={user.id}
                                    >
                                        <NavLink
                                            to={`/chat-messages/${sessionUser.id}/${user.id}`}
                                        >
                                            Chat with {user.username}
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatMessagesIntro;