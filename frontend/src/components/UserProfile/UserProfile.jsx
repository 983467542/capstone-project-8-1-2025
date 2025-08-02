// frontend/src/components/UserProfile/UserProfile.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreUser } from '../../store/session';
import { deleteUser } from '../../store/users';
import { csrfFetch } from '../../store/csrf';
import './UserProfile.css';
import '../UseState/UseState.css';
import UseState from '../UseState/UseState';

function UserProfile() {
  const dispatch = useDispatch();
  const [locations, setLocations] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [profileUser, setProfileUser] = useState(null);
  const sessionUser = useSelector((state) => state.session.user);
  const [isEditing, setIsEditing] = useState(false);
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [ethnicities, setEthnicities] = useState([]);
  const [showEthnicityDropdown, setShowEthnicityDropdown] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
  const dropdownRef = useRef();

  const [formData, setFormData] = useState({
    age: '',
    ethnicity: [],
    gender: '',
    interests: [],
    objectives: [],
    location: '',
    locationRadius: '',
    customLocationRadius: '',
    availability: '',
    bio: '',
    sexualOrientation: [],
    matchType: 'any',
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev };

      if (['age-ranges', 'ethnicity', 'interests', 'objectives', 'bio', 'customLocationRadius'].includes(name)) {
        newFormData[name] = Array.isArray(value) ? value : [value];
      } else {
        newFormData[name] = value;
      }

      if (name === 'locationRadius' && value === 'Other') {
        newFormData.customLocationRadius = '';
      }

      return newFormData;
    });
  };

  const draftKey = sessionUser?.id ? `userProfileDraft_${sessionUser.id}` : null;

  useEffect(() => {
    setProfileUser(null);
    setFormData({
      age: '',
      ethnicity: [],
      gender: '',
      interests: [],
      objectives: [],
      location: '',
      locationRadius: '',
      customLocationRadius: '',
      availability: '',
      bio: '',
      sexualOrientation: [],
      matchType: 'any',
    });
    setSelectedCountry('');
    setSelectedState('');
    setSelectedCity('');
  }, [sessionUser?.id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/users/${sessionUser?.id}`);
        if (!response.ok) throw new Error('Failed to fetch profile data');
        const data = await response.json();
        setProfileUser(data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err.message);
      }
    };

    if (sessionUser?.id) fetchUserProfile();
  }, [sessionUser?.id]);

  useEffect(() => {
    dispatch(restoreUser());
  }, [dispatch]);

  useEffect(() => {
    if (!profileUser) return;

    const savedProfile = draftKey ? localStorage.getItem(draftKey) : null;
    const locationParts = profileUser.location?.split(',').map(s => s.trim());
    const [city, state, country] = locationParts || [];

    const fallbackFormData = {
      age: profileUser.age?.toString() || '',
      ethnicity: typeof profileUser.ethnicity === 'string'
        ? profileUser.ethnicity.split(',').map(e => e.trim()).filter(e => e)
        : [],
      gender: profileUser.gender || '',
      interests: profileUser.interests?.split(',').map(e => e.trim()) || [],
      objectives: profileUser.objectives?.split(',').map(e => e.trim()) || [],
      location: profileUser.location || '',
      locationRadius: profileUser.locationRadius?.toString() || '',
      customLocationRadius: profileUser.customLocationRadius?.toString() || '',
      availability: profileUser.availability || '',
      bio: profileUser.bio || '',
      sexualOrientation: profileUser.sexualOrientation
        ? profileUser.sexualOrientation.split(',').map(e => e.trim()).filter(e => e)
        : [],
      matchType: 'any',
    };

    let finalFormData = fallbackFormData;

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        finalFormData = {
          ...fallbackFormData,
          ...parsed,
          ethnicity: parsed.ethnicity
            ? parsed.ethnicity.split(',').map(e => e.trim()).filter(e => e)
            : [],
          interests: parsed.interests
            ? parsed.interests.split(',').map(e => e.trim()).filter(e => e)
            : [],
          objectives: parsed.objectives
            ? parsed.objectives.split(',').map(e => e.trim()).filter(e => e)
            : [],
          sexualOrientation: parsed.sexualOrientation
            ? parsed.sexualOrientation.split(',').map(e => e.trim()).filter(e => e)
            : [],
          locationRadius:
            parsed.locationRadius != null
              ? String(parsed.locationRadius)
              : fallbackFormData.locationRadius,
          customLocationRadius: parsed.customLocationRadius != null
            ? parsed.customLocationRadius.toString()
            : '',
        };
      } catch (err) {
        console.error('Failed to parse saved profileDraft:', err);
      }
    }

    setFormData(finalFormData);
    setSelectedCountry(country || '');
    setSelectedState(state || '');
    setSelectedCity(city || '');

    setOriginalFormData({
      ...finalFormData,
      selectedCountry: country || '',
      selectedState: state || '',
      selectedCity: city || '',
    });

    setShowProfileInfo(true);
  }, [profileUser]);

  useEffect(() => {
    fetch('/ethnicities.json')
      .then(res => res.json())
      .then(data => setEthnicities(data))
      .catch(err => console.error('Error loading ethnicities:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEthnicityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetch('/countries+states+cities.json')
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error('Error loading locations:', err));
  }, []);

  //   useEffect(() => {
  //   if (!sessionUser?.id) {
  //     Object.keys(localStorage)
  //       .filter(key => key.startsWith('userProfileDraft_'))
  //       .forEach(key => localStorage.removeItem(key));
  //   }
  // }, [sessionUser?.id]);

  const handleDeleteProfile = async () => {
    if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {

      try {
        const response = await csrfFetch('/users', {
          method: 'DELETE',
          headers: {
          },
        });

        if (response.ok) {
          await dispatch(deleteUser());
          window.location.href = '/';
        } else {
          alert('Failed to delete profile.');
        }
      } catch (err) {
        console.error('Failed to delete profile:', err);
        alert('There was an error deleting your profile.');
      }
    }
  };

  // const handleAddProfileImage = async () => {

  // }

  const handleEditProfile = async (e) => {
    e.preventDefault();

    const parsedAge = parseInt(formData.age, 10);
    if (isNaN(parsedAge) || parsedAge < 18) {
      alert("Age must be a number and at least 18.");
      return;
    }

    if (formData.locationRadius === 'Other') {
      const customRadiusNum = parseInt(formData.customLocationRadius);
      if (!customRadiusNum || customRadiusNum <= 0) {
        alert('Please enter a valid custom location radius.');
        return;
      }
    }

    const locationParts = [selectedCity, selectedState, selectedCountry].filter(Boolean);
    const fullLocation = locationParts.join(', ');

    const payload = {
      age: parsedAge || null,
      location: fullLocation,
      locationRadius:
        formData.locationRadius === 'Other'
          ? 'Other'
          : parseInt(formData.locationRadius) || null,
      customLocationRadius:
        formData.locationRadius === 'Other'
          ? parseInt(formData.customLocationRadius, 10) || null
          : null,
      availability: formData.availability,
      ethnicity: formData.ethnicity.filter(e => e).join(', '),
      gender: formData.gender,
      interests: formData.interests.join(', '),
      objectives: formData.objectives.join(', '),
      bio: formData.bio,
      sexualOrientation: formData.sexualOrientation.filter(e => e).join(', '),
      userId: sessionUser?.id,
    };

    // console.log('Final payload to submit:', payload);

    try {
      const response = await csrfFetch('/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await response.json();
        if (draftKey) {
          localStorage.setItem(draftKey, JSON.stringify({
            ...payload,
            locationRadius: String(payload.locationRadius),
          }));
        }
        const profileRes = await fetch(`/api/users/${sessionUser?.id}`);
        if (profileRes.ok) {
          const fullUser = await profileRes.json();
          setProfileUser(fullUser);
        }
        await dispatch(restoreUser());
        alert('Profile updated successfully!');
        setIsEditing(false);
        setShowProfileInfo(true);
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`Error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(`There was an error updating your profile: ${err.message}`);
    }
  };

  if (!sessionUser) {
    return (
      <>
        <p>Please log in or sign up to create a profile.</p>
      </>
    );
  }

  const toggleValue = (array = [], value) => {
    if (array.includes(value)) {
      return array.filter((v) => v !== value);
    } else {
      return [...array, value];
    }
  };

  const handleDeselectAll = (fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: [] }));
  };

  const handleClearAllSelections = () => {
    setFormData({
      age: '',
      ethnicity: [],
      gender: '',
      interests: [],
      objectives: [],
      location: '',
      locationRadius: '',
      customLocationRadius: '',
      availability: '',
      bio: '',
      sexualOrientation: [],
      matchType: 'any',
    });
    setSelectedCountry('');
    setSelectedState('');
    setSelectedCity('');
  };

  const handleRevertNewSelections = () => {
    if (originalFormData) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        age: originalFormData.age,
        ethnicity: originalFormData.ethnicity,
        gender: originalFormData.gender,
        interests: originalFormData.interests,
        objectives: originalFormData.objectives,
        sexualOrientation: originalFormData.sexualOrientation,
        bio: originalFormData.bio,
        locationRadius: originalFormData.locationRadius,
        customLocationRadius: originalFormData.customLocationRadius,
        availability: originalFormData.availability,
      }));
      setSelectedCountry(originalFormData.selectedCountry || '');
      setSelectedState(originalFormData.selectedState || '');
      setSelectedCity(originalFormData.selectedCity || '');
    }
  };

  return (
    <div>
      <div className={`header ${theme}`}>
        <UseState setTheme={setTheme} />
        <h1>My Profile</h1>
      </div>

      <div className="user-profile-cards">
        <div>
          <button type="button" className={`rounded-rectangular-button ${theme}`} onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        <div>
          <button type="button" className={`rounded-rectangular-button ${theme}`} onClick={handleDeleteProfile}>Delete profile</button>
        </div>

        <div>
          <button
            type="button"
            className={`rounded-rectangular-button ${theme}`}
            onClick={() => alert("Feature coming soon")}
          >
            Add Profile Image
          </button>
        </div>

        {showProfileInfo && !isEditing && (
          <div className="user-info">
            <h3>Profile Information</h3>
            <p><strong>Profile Image</strong></p>
            <br />
            <br />
            <br />
            <br />
            <p>
              <strong>First Name:</strong>{" "}
              {profileUser && profileUser.firstName
                ? profileUser.firstName
                : 'N/A'}
            </p>
            <p><strong>Username:</strong> {profileUser?.username || 'Username not available'}</p>
            <p><strong>Age:</strong> {profileUser?.age ?? 'Not added yet'}</p>
            <p><strong>Ethnicity/Ethnicities:</strong> {
              profileUser
                ? Array.isArray(profileUser.ethnicity) && profileUser.ethnicity.length > 0
                  ? profileUser.ethnicity.join(', ')
                  : profileUser.ethnicity || 'Not added'
                : 'Loading...'
            }</p>
            <p><strong>Gender:</strong> {profileUser?.gender || 'Not added'}</p>
            <p><strong>Interests:</strong> {
              profileUser
                ? Array.isArray(profileUser.interests) && profileUser.interests.length > 0
                  ? profileUser.interests.join(', ')
                  : profileUser.interests || 'Not added yet'
                : 'Loading...'
            }</p>
            <p><strong>Objectives:</strong> {
              profileUser
                ? Array.isArray(profileUser.objectives) && profileUser.objectives.length > 0
                  ? profileUser.objectives.join(', ')
                  : profileUser.objectives || 'Not added yet'
                : 'Loading...'
            }</p>
            <p><strong>Bio:</strong> {
              profileUser
                ? profileUser.bio?.trim() || 'Not added yet'
                : 'Loading...'
            }</p>
            <p><strong>Sexual Orientation:</strong> {
              profileUser
                ? Array.isArray(profileUser.sexualOrientation) &&
                  profileUser.sexualOrientation.length > 0
                  ? profileUser.sexualOrientation.join(', ')
                  : profileUser.sexualOrientation || 'Not added'
                : 'Loading...'}</p>
          </div>
        )}

        {isEditing && (
          <div>
            <h3>Edit Profile</h3>
            <label htmlFor="age">
              <strong>
                Age:
              </strong>
            </label>
            <input
              type="number"
              min="18"
              className="user-profile-input"
              id="age"
              value={formData.age}
              onChange={(e) => {
                const value = e.target.value;

                if (value === '' || /^\d+$/.test(value)) {
                  setFormData({ ...formData, age: value });
                }
              }}
            />

            <div className="ethnicity-multiselect" ref={dropdownRef}>
              <label>
                <strong>
                  Ethnicity/Ethnicities:
                </strong>
              </label>
              <div
                className="user-profile-dropdown-display"
                onClick={() => setShowEthnicityDropdown(!showEthnicityDropdown)}
              >
                {formData.ethnicity?.length > 0
                  ? formData.ethnicity.join(', ')
                  : 'Select Ethnicity/Ethnicities'}
                <span className="dropdown-arrow">▼</span>
              </div>

              {showEthnicityDropdown && (
                <div className="user-profile-dropdown-options">
                  <label className="deselect-all-option">
                    <input
                      type="checkbox"
                      checked={formData.ethnicity.length === 0}
                      onChange={() => handleDeselectAll('ethnicity')}
                    />
                    Deselect All
                  </label>
                  {[...ethnicities].sort().map((ethnicity, index) => (
                    <label key={index}>
                      <input
                        type="checkbox"
                        name="ethnicity"
                        value={ethnicity}
                        checked={formData.ethnicity?.includes(ethnicity) || false}
                        onChange={(e) =>
                          handleDropdownChange(
                            'ethnicity',
                            toggleValue(formData.ethnicity || [], e.target.value)
                          )
                        }
                      />
                      {ethnicity}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <label><strong>Gender:</strong></label>
            <div className="checkbox-group">
              {['Female', 'Male', 'Nonbinary', 'Trans'].map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    value={option}
                    checked={formData.gender === option}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        gender: formData.gender === option ? '' : option,
                      })
                    }
                  />
                  {option}
                </label>
              ))}
              <label className="deselect-all-option">
                <input
                  type="checkbox"
                  checked={formData.gender === ''}
                  onChange={() => setFormData({ ...formData, gender: '' })}
                />
                Deselect All
              </label>
            </div>

            <div>
              <label><strong>Location:</strong></label>
              <br />
              <label><strong>Country:</strong></label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedState('');
                  setSelectedCity('');
                }}
              >
                <option value="">Select a country</option>
                {locations.map((country) => (
                  <option key={country.id} value={country.name}>{country.name}</option>
                ))}
              </select>
            </div>

            {selectedCountry && (
              <div>
                <label><strong>State:</strong></label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('');
                  }}
                >
                  <option value="">Select a state</option>
                  {locations.find(c => c.name === selectedCountry)?.states.map(state => (
                    <option key={state.id} value={state.name}>{state.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedState && (
              <div>
                <label><strong>City:</strong></label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                  }}
                >
                  <option value="">Select a city</option>
                  {locations.find(c => c.name === selectedCountry)?.states.find(s => s.name === selectedState)?.cities.map(city => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>
            )}

            <label><strong>Location Radius:</strong></label>
            <div className="checkbox-group">
              {['10', '15', '20', '25', 'Other'].map((radius) => (
                <label key={radius}>
                  <input
                    type="checkbox"
                    value={radius}
                    checked={String(formData.locationRadius) === radius}
                    onChange={() => {
                      if (formData.locationRadius === radius) {
                        setFormData({
                          ...formData,
                          locationRadius: '',
                          customLocationRadius: '',
                        });
                      } else {
                        setFormData({
                          ...formData,
                          locationRadius: String(radius),
                          customLocationRadius: radius === 'Other' ? formData.customLocationRadius : '',
                        });
                      }
                    }}
                  />
                  {radius === 'Other' ? 'Other' : `${radius} miles`}
                </label>
              ))}

              <label className="deselect-all-option">
                <input
                  type="checkbox"
                  checked={formData.locationRadius === null || formData.locationRadius === ''}
                  onChange={() =>
                    setFormData({ ...formData, locationRadius: '', customLocationRadius: '' })
                  }
                />
                Deselect All
              </label>
            </div>

            {formData.locationRadius === 'Other' && (
              <input
                type="number"
                placeholder="Enter custom radius"
                value={formData.customLocationRadius ?? ''}
                onChange={(e) => {
                  setFormData({ ...formData, customLocationRadius: e.target.value });
                }}
              />
            )}

            <label>
              <strong>
                Availability:
              </strong>
            </label>
            <div className="checkbox-group">
              {['Weekdays', 'Weekends', 'Mornings', 'Evenings', 'Flexible'].map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    value={option}
                    checked={formData.availability === option}
                    onChange={() => setFormData({ ...formData, availability: option })}
                  />
                  {option}
                </label>
              ))}
            </div>

            <label>
              <strong>
                Interests:
              </strong>
            </label>
            <div className="checkbox-group">
              {['Art', 'Cooking', 'Drama', 'English', 'Fitness', 'Food', 'Games', 'Geography', 'Hiking', 'History', 'Math', 'Movies', 'Music', 'Photography', 'Reading', 'Science', 'Sports', 'Technology', 'Traveling', 'TV Shows', 'Volunteering', 'Yoga', 'Other'].map((interest) => (
                <label key={interest}>
                  <input
                    type="checkbox"
                    value={interest}
                    checked={formData.interests.includes(interest)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.interests, interest]
                        : formData.interests.filter(val => val !== interest);
                      setFormData({ ...formData, interests: updated });
                    }}
                  />
                  {interest}
                </label>
              ))}
              <label className="deselect-all-option">
                <input
                  type="checkbox"
                  checked={formData.interests.length === 0}
                  onChange={() => handleDeselectAll('interests')}
                />
                Deselect All
              </label>
            </div>

            <label>
              <strong>
                Objectives:
              </strong>
            </label>
            <div className="checkbox-group">
              {['Book club', 'Building Connections', 'Gaming', 'Gym', 'Having Lunch', 'Meeting New People', 'Networking', 'Party', 'Personal Growth', 'Road trip', 'Shopping', 'Skill Development', 'Taking classes', 'Venting to someone', 'Watching a movie', 'Watching a TV show', 'Other'].map((objective) => (
                <label key={objective}>
                  <input
                    type="checkbox"
                    value={objective}
                    checked={formData.objectives.includes(objective)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.objectives, objective]
                        : formData.objectives.filter(val => val !== objective);
                      setFormData({ ...formData, objectives: updated });
                    }}
                  />
                  {objective}
                </label>
              ))}
              <label className="deselect-all-option">
                <input
                  type="checkbox"
                  checked={formData.objectives.length === 0}
                  onChange={() => handleDeselectAll('objectives')}
                />
                Deselect All
              </label>
            </div>

            <label htmlFor="bio">
              <strong>
                Bio:
              </strong>
            </label>
            <input
              type="text" className="user-profile-input"
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />

            <label>
              <strong>
                Sexual Orientation:
              </strong>
            </label>
            <div className="checkbox-group">
              {['Asexual', 'Bisexual', 'Gay', 'Lesbian', 'Pansexual', 'Straight'].map((sexualOrientation) => (
                <label key={sexualOrientation}>
                  <input
                    type="checkbox"
                    value={sexualOrientation}
                    checked={formData.sexualOrientation.includes(sexualOrientation)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.sexualOrientation, sexualOrientation]
                        : formData.sexualOrientation.filter(val => val !== sexualOrientation);
                      setFormData({ ...formData, sexualOrientation: updated });
                    }}
                  />
                  {sexualOrientation}
                </label>
              ))}
              <label className="deselect-all-option">
                <input
                  type="checkbox"
                  checked={formData.sexualOrientation.length === 0}
                  onChange={() => handleDeselectAll('sexualOrientation')}
                />
                Deselect All
              </label>
            </div>

            <form onSubmit={handleEditProfile}>
              <button type="submit" className={`rounded-rectangular-button ${theme}`}>
                Save Changes
              </button>
            </form>

            <button
              type="button"
              className={`rounded-rectangular-button ${theme}`}
              onClick={handleRevertNewSelections}
            >
              Revert to Original Selections
            </button>

            <button
              type="button"
              className={`rounded-rectangular-button ${theme}`}
              onClick={handleClearAllSelections}
            >
              Clear All Selections
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;