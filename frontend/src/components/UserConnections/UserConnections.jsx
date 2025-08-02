// frontend/src/components/UserConnections/UserConnections.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserConnectionsForms from './UserConnectionsForms';
import { useSelector } from 'react-redux';
import './UserConnections.css';
import '../UseState/UseState.css';
import UseState from '../UseState/UseState';

const UserConnections = () => {
  const user = useSelector(state => state.session.user);

  const [formData, setFormData] = useState({
    'age-ranges': [],
    interests: [],
    objectives: [],
    location: '',
    locationRadius: '',
    customLocationRadius: '',
    ethnicity: [],
    gender: '',
    bio: '',
    sexualOrientation: [],
    matchType: '',
  });

  const [results, setResults] = useState(() => {
    if (user) {
      const stored = localStorage.getItem(`filteredResults-${user.id}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [fullUsers, setFullUsers] = useState([]);

  const [showForm, setShowForm] = useState(() => {
    if (user) {
      const stored = localStorage.getItem(`showForm-${user.id}`);
      return stored === null ? true : stored === 'true';
    }
    return true;
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`filteredResults-${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setResults(parsed);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    async function fetchFullUserDetails() {
      if (!results.length) {
        setFullUsers([]);
        return;
      }

      try {
        const ids = results.map(item => item.id);
        const query = `/api/users/details?ids=${ids.join(',')}`;
        const res = await fetch(query);
        if (!res.ok) throw new Error('Failed to fetch user details');
        const data = await res.json();
        setFullUsers(data);
      } catch (err) {
        console.error('Error fetching full user details:', err);
      }
    }

    fetchFullUserDetails();
  }, [results]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`filteredResults-${user.id}`, JSON.stringify(results));
    }
  }, [results, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`showForm-${user.id}`, showForm);
    }
  }, [showForm, user]);

  useEffect(() => {
    if (!user) {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('filteredResults-') || key.startsWith('showForm-')) {
          localStorage.removeItem(key);
        }
      });
      setResults([]);
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <p>Please log in to view and manage your connection results.</p>
      </>
    )
  }

  return (
    <div className={`user-connections-header ${theme}`}>
      <UseState setTheme={setTheme} theme={theme} />
      <h1 className={`user-connections-h1 ${theme}`}>My Connections</h1>
      <div className={`wrapper ${theme}`}>

        {showForm ? (
          <UserConnectionsForms
            formData={formData}
            setFormData={setFormData}
            setResults={setResults}
            setShowForm={setShowForm}
            onSubmitSuccess={() => setShowForm(false)}
            theme={theme}
            setTheme={setTheme}
          />
        ) : (
          <button type="button" className={`rounded-rectangular-button ${theme}`} onClick={() => setShowForm(true)}>Edit Preferences</button>
        )}

        {!showForm && results.length > 0 && (
          <p style={{ color: 'green' }}>Preferences saved. You can edit them above.</p>
        )}

        <hr />

        <h3>Filtered Results:</h3>
        {results.length > 0 ? (
          <>
            {fullUsers.map((item, index) => {
              if (!item || !item.id || !item.username || !item.firstName) return null;

              return (
                <p key={index}>
                  <strong>{item.username}</strong> ({item.firstName}) — <strong>Age: </strong>{item.age || 'Not added yet'} — <strong>Ethnicity: </strong>{Array.isArray(item.ethnicity) ? item.ethnicity.join(', ') : item.ethnicity || 'Undisclosed'} — <strong>Interests: </strong>{item.interests || 'Not added yet'} — <strong>Objectives: </strong>{item.objectives || 'Not added yet'} — <strong>Bio: </strong>{item.bio || 'Not added yet'}
                  <br />
                  <Link to={`/connection-profile/${item.id}`}>
                    <button 
                    type="button" 
                    className={`user-connections-rounded-rectangular-button ${theme}`}>View Connection Profile</button>
                  </Link>
                </p>
              );
            })}
          </>
        ) : (
          <p>No results yet. Submit the form above.</p>
        )}
      </div>
    </div>
  );
};

// Recommendations
// If both users match based on interests and/or objectives: Display both users to each other

// Social Meetings
// Lists of activities: Suggested meeting ideas like coffee or walk
// Places of activities: Suggested locations based on the shared location radius
// Calendar and time slots: Suggested time slots
// Add time button: Lets a user suggest a custom time
// Add activity button: Lets a user suggest a custom activity
// Add place button: Lets a user suggest a custom location

// Connections
// Want to meet button: Used to initiate a meeting
// Meet again button: Available after the meeting if a user wants to meet again
// End meeting button: Used to indicate a user does not want to continue; chat is disabled

// Report
// Report button: Allows a user to report another user for inappropriate behavior

export default UserConnections;