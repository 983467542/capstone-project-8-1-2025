// frontend/src/components/UserConnectionsForms/UserConnectionsForms.jsx
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import HoverClickDropdown from '../UserProfile/HoverClickDropdown';
import { csrfFetch } from '../../store/csrf';
import { setFilteredResults, fetchAllConnections } from '../../store/user-connections';
import './UserConnectionsForms.css';
import '../UseState/UseState.css';

function UserConnectionsForms({
  formData, setFormData, setResults,
  onSubmitSuccess, setShowForm,
  theme }) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [ethnicities, setEthnicities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showEthnicityDropdown, setShowEthnicityDropdown] = useState(false);
  const [profileUser,] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);

  const dropdownRef = useRef();
  const user = useSelector((state) => state.session.user);
  const results = useSelector(state => state.userConnections.filteredResults || []);

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev };

      if (['age-ranges', 'interests', 'objectives', 'ethnicity', 'gender', 'sexualOrientation'].includes(name)) {
        newFormData[name] = Array.isArray(value) ? value : [value];
      } else {
        newFormData[name] = value;
      }

      if (name === 'locationRadius' && value === 'other') {
        newFormData.customLocationRadius = '';
      }

      return newFormData;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.matchType) {
      setError('Please select a match type.');
      setIsSubmitting(false);
      return;
    }

    const hasFilters =
      formData['age-ranges'].length > 0 ||
      formData.interests.length > 0 ||
      formData.objectives.length > 0 ||
      (formData.ethnicity.length > 0) ||
      (formData.gender && formData.gender.trim().length > 0) ||
      formData.sexualOrientation.length > 0 ||
      (selectedCity || selectedState || selectedCountry);

    if (!hasFilters) {
      setError('Please select at least one filter criteria.');
      setIsSubmitting(false);
      return;
    }

    const locationParts = [selectedCity, selectedState, selectedCountry].filter(Boolean);
    const fullLocation = locationParts.join(', ');

    const locationRadius =
      formData.locationRadius === 'other'
        ? parseInt(formData.customLocationRadius) || 0
        : parseInt(formData.locationRadius) || 0;

    const payload = {
      ...formData,
      location: fullLocation,
      locationRadius,
      customLocationRadius:
        formData.locationRadius === 'other' ? formData.customLocationRadius : '',
      userId: user?.id,
    };

    try {
      const response = await csrfFetch('/filter-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Server responded with an error');

      const data = await response.json();
      const sanitizedData = data.map(({ id, username, firstName, interests, objectives }) => ({
        id,
        username,
        firstName,
        interests,
        objectives,
      }));
      if (setResults) setResults(sanitizedData);
      if (data && data.length > 0) {
        setOriginalFormData({
          ...formData,
          selectedCity,
          selectedState,
          selectedCountry,
          location: [selectedCity, selectedState, selectedCountry].filter(Boolean).join(', '),
        });
      }

      localStorage.setItem(`filteredResults-${user.id}`, JSON.stringify(sanitizedData));
      localStorage.setItem(`filterCriteria-${user.id}`, JSON.stringify({
        ...formData,
        selectedCity,
        selectedState,
        selectedCountry,
      }));
      window.dispatchEvent(new Event('filteredResultsUpdated'));

      dispatch(setFilteredResults(sanitizedData));
      await dispatch(fetchAllConnections());
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error('Failed to fetch filtered results:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearResults = async () => {
    setError(null);

    setFormData({
      'age-ranges': [],
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
      matchType: '',
    });
    setSelectedCountry('');
    setSelectedState('');
    setSelectedCity('');

    try {
      const response = await csrfFetch('/filter-results/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (!response.ok) throw new Error('Reset failed');

      await response.json();
      if (setResults) setResults([]);
      localStorage.removeItem(`filteredResults-${user.id}`);
      localStorage.removeItem(`filterCriteria-${user.id}`);
      dispatch(setFilteredResults([]));
      window.dispatchEvent(new Event('filteredResultsUpdated'));
    } catch (error) {
      console.error('Failed to clear filter results:', error);
      setError('Failed to clear results.');
    }
  };

  useEffect(() => {
    if (user && results.length) {
      dispatch(setFilteredResults(results));
    }
  }, [user, results, dispatch]);

  useEffect(() => {
    if (user) {
      const storedResults = localStorage.getItem(`filteredResults-${user.id}`);
      if (storedResults) {
        const parsed = JSON.parse(storedResults);
        if (parsed.length > 0) {
          const sanitized = parsed.map(({ id, username, firstName, interests, objectives }) => ({
            id,
            username,
            firstName,
            interests,
            objectives,
          }));
          if (setResults) setResults(sanitized);
          dispatch(setFilteredResults(sanitized));
        }
      }

      const storedCriteria = localStorage.getItem(`filterCriteria-${user.id}`);
      if (storedCriteria) {
        const parsedForm = JSON.parse(storedCriteria);
        setFormData(parsedForm);
        setOriginalFormData(parsedForm);
        setSelectedCity(parsedForm.selectedCity || '');
        setSelectedState(parsedForm.selectedState || '');
        setSelectedCountry(parsedForm.selectedCountry || '');
      }
    }
  }, [user, dispatch, setResults, setFormData]);

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
      .then(data =>
        setLocations(data)
      )
      .catch(err => console.error('Error loading locations:', err));
  }, []);

  useEffect(() => {
    if (profileUser) {
      const initialData = {
        age: profileUser.age?.toString() || '',
        ethnicity: typeof profileUser.ethnicity === 'string'
          ? profileUser.ethnicity.split(',').map(e => e.trim()).filter(e => e)
          : [],
        gender: profileUser.gender || '',
        interests: typeof profileUser.interests === 'string'
          ? profileUser.interests.split(',').map(e => e.trim()).filter(e => e)
          : [],
        objectives: typeof profileUser.objectives === 'string'
          ? profileUser.objectives.split(',').map(e => e.trim()).filter(e => e)
          : [],
        location: profileUser.location || '',
        locationRadius: profileUser.locationRadius?.toString() || '',
        customLocationRadius: profileUser.customLocationRadius?.toString() || '',
        availability: profileUser.availability || '',
        bio: profileUser.bio || '',
        sexualOrientation: typeof profileUser.sexualOrientation === 'string'
          ? profileUser.sexualOrientation.split(',').map(e => e.trim()).filter(e => e)
          : [],
        matchType: 'any',
      };
      setFormData(initialData);
      setOriginalFormData(prev => prev || {
        ...initialData,
        selectedCity: profileUser.city || '',
        selectedState: profileUser.state || '',
        selectedCountry: profileUser.country || '',
      });
    }
  }, [profileUser]);

  useEffect(() => {
    if (!originalFormData && Object.keys(formData).length > 0) {
      setOriginalFormData(formData);
    }
  }, [formData, originalFormData]);

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    const updatedRanges = [...formData['age-ranges']];

    if (checked && !updatedRanges.includes(value)) {
      updatedRanges.push(value);
    } else if (!checked && updatedRanges.includes(value)) {
      const index = updatedRanges.indexOf(value);
      updatedRanges.splice(index, 1);
    }

    setFormData((prev) => ({
      ...prev,
      'age-ranges': updatedRanges,
    }));
  };

  const toggleValue = (array = [], value) => {
    if (array.includes(value)) {
      return array.filter((v) => v !== value);
    } else {
      return [...array, value];
    }
  };

  const handleRevertToSelectedFilters = () => {
    if (originalFormData) {
      setFormData(originalFormData);
      setSelectedCity(originalFormData.selectedCity || '');
      setSelectedState(originalFormData.selectedState || '');
      setSelectedCountry(originalFormData.selectedCountry || '');
    }
  };

  const handleClearAllFilters = () => {
    setFormData({
      'age-ranges': [],
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
      matchType: '',
    });
    setSelectedCountry('');
    setSelectedState('');
    setSelectedCity('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          <strong>
            Age Range:
          </strong>
        </label>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData['age-ranges'].length === 0}
              onChange={() => setFormData((prev) => ({ ...prev, ['age-ranges']: [] }))}
            />
            Deselect All
          </label>
          {Array.from({ length: 100 - 18 + 1 }, (_, i) => {
            const age = (i + 18).toString();
            return (
              <label key={age}>
                <input
                  type="checkbox"
                  name="age-ranges"
                  value={age}
                  checked={formData['age-ranges']?.includes(age) || false}
                  onChange={handleCheckboxChange}
                />
                {age}
              </label>
            );
          })}
        </div>

        < br />

        <div className="ethnicity-multiselect" ref={dropdownRef}>
          <label>
            <strong>
              Ethnicity/Ethnicities:
            </strong>
          </label>
          <div
            className="dropdown-display"
            onClick={() => setShowEthnicityDropdown(!showEthnicityDropdown)}
          >
            {formData.ethnicity?.length > 0
              ? formData.ethnicity.join(', ')
              : 'Select Ethnicity/Ethnicities'}
            <span className="dropdown-arrow">▼</span>
          </div>

          {showEthnicityDropdown && (
            <div className="user-connections-forms-dropdown-options">
              <label>
                <input
                  type="checkbox"
                  checked={formData.ethnicity.length === 0}
                  onChange={() => setFormData((prev) => ({ ...prev, ethnicity: [] }))}
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

        <label>
          <strong>
            Gender:
          </strong>
        </label>
        <div className="checkbox-group">
          {[
            { value: 'Female', label: 'Female' },
            { value: 'Male', label: 'Male' },
            { value: 'Nonbinary', label: 'Nonbinary' },
            { value: 'Trans', label: 'Trans' },
          ].map(({ value, label }) => (
            <label key={value}>
              <input
                type="radio"
                name="gender"
                value={value}
                checked={formData.gender === value}
                onChange={handleInputChange}
              />
              {label}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={formData.gender === ''}
              onChange={() => setFormData((prev) => ({ ...prev, gender: '' }))}
            />
            Deselect All
          </label>
        </div>

        <label>
          <strong>
            Interests:
          </strong>
        </label>
        <div className="checkbox-group">
          {[
            { value: 'Art', label: 'Art' },
            { value: 'Cooking', label: 'Cooking' },
            { value: 'Drama', label: 'Drama' },
            { value: 'English', label: 'English' },
            { value: 'Fitness', label: 'Fitness' },
            { value: 'Food', label: 'Food' },
            { value: 'Games', label: 'Games' },
            { value: 'Geography', label: 'Geography' },
            { value: 'Hiking', label: 'Hiking' },
            { value: 'History', label: 'History' },
            { value: 'Math', label: 'Math' },
            { value: 'Movies', label: 'Movies' },
            { value: 'Music', label: 'Music' },
            { value: 'Photography', label: 'Photography' },
            { value: 'Reading', label: 'Reading' },
            { value: 'Science', label: 'Science' },
            { value: 'Sports', label: 'Sports' },
            { value: 'Technology', label: 'Technology' },
            { value: 'Traveling', label: 'Traveling' },
            { value: 'TV Shows', label: 'TV Shows' },
            { value: 'Volunteering', label: 'Volunteering' },
            { value: 'Yoga', label: 'Yoga' },
            { value: 'Other', label: 'Other' },
          ].map(({ value, label }) => (
            <label key={value}>
              <input
                type="checkbox"
                name="interests"
                value={value}
                checked={formData.interests?.includes(value) || false}
                onChange={(e) => handleDropdownChange('interests', toggleValue(formData.interests, e.target.value))}
              />
              {label}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={formData.interests.length === 0}
              onChange={() => setFormData((prev) => ({ ...prev, interests: [] }))}
            />
            Deselect All
          </label>
        </div>

        < br />

        <label>
          <strong>
            Objectives:
          </strong>
        </label>
        <div className="checkbox-group">
          {[
            { value: 'Book club', label: 'Book club' },
            { value: 'Building Connections', label: 'Building Connections' },
            { value: 'Gaming', label: 'Gaming' },
            { value: 'Gym', label: 'Gym' },
            { value: 'Having Lunch', label: 'Having Lunch' },
            { value: 'Meeting New People', label: 'Meeting New People' },
            { value: 'Networking', label: 'Networking' },
            { value: 'Party', label: 'Party' },
            { value: 'Personal Growth', label: 'Personal Growth' },
            { value: 'Road trip', label: 'Road trip' },
            { value: 'Shopping', label: 'Shopping' },
            { value: 'Skill Development', label: 'Skill Development' },
            { value: 'Taking classes', label: 'Taking classes' },
            { value: 'Venting to someone', label: 'Venting to someone' },
            { value: 'Watching a movie', label: 'Watching a movie' },
            { value: 'Watching a TV show', label: 'Watching a TV show' },
            { value: 'other', label: 'Other' },
          ].map(({ value, label }) => (
            <label key={value}>
              <input
                type="checkbox"
                name="objectives"
                value={value}
                checked={formData.objectives?.includes(value) || false}
                onChange={(e) => handleDropdownChange('objectives', toggleValue(formData.objectives, e.target.value))}
              />
              {label}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={formData.objectives.length === 0}
              onChange={() => setFormData((prev) => ({ ...prev, objectives: [] }))}
            />
            Deselect All
          </label>
        </div>

        <div>
          <label>
            <strong>
              Location:
            </strong>
          </label>
          < br />
          <label>
            <strong>
              Country:
            </strong>
          </label>
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
              <option key={country.id} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCountry && (
          <div>
            <label>
              <strong>
                State:
              </strong>
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity('');
              }}
            >
              <option value="">Select a state</option>
              {locations
                .find((c) => c.name === selectedCountry)
                ?.states.map((state) => (
                  <option key={state.id} value={state.name}>
                    {state.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {selectedState && (
          <div>
            <label>
              <strong>
                City:
              </strong>
            </label>
            <select
              name="location"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                const locationString = `${e.target.value}, ${selectedState}, ${selectedCountry}`;
                setFormData((prev) => ({
                  ...prev,
                  location: locationString
                }));
              }}
            >
              <option value="">Select a city</option>
              {locations
                .find((c) => c.name === selectedCountry)
                ?.states.find((s) => s.name === selectedState)
                ?.cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        < br />

        <label>
          <strong>
            Location Radius:
          </strong>
        </label>
        <div className="checkbox-group">
          {[
            { value: '10', label: '10 miles' },
            { value: '15', label: '15 miles' },
            { value: '20', label: '20 miles' },
            { value: '25', label: '25 miles' },
            { value: 'other', label: 'Other' },
          ].map(({ value, label }) => (
            <label key={value}>
              <input
                type="radio"
                name="locationRadius"
                value={value}
                checked={formData.locationRadius === value}
                onChange={handleInputChange}
              />
              {label}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={formData.locationRadius === ''}
              onChange={() => setFormData((prev) => ({ ...prev, locationRadius: '' }))}
            />
            Deselect All
          </label>
        </div>

        {formData.locationRadius === 'other' && (
          <div>
            <label>
              <strong>
                Custom Location Radius (miles):
              </strong>
            </label>
            <input
              type="number"
              name="customLocationRadius"
              value={formData.customLocationRadius}
              onChange={handleInputChange}
              placeholder="Enter custom radius"
            />
          </div>
        )}

        < br />

        <label>
          <strong>
            Sexual Orientation:
          </strong>
        </label>
        <div className="checkbox-group">
          {[
            { value: 'Asexual', label: 'Asexual' },
            { value: 'Bisexual', label: 'Bisexual' },
            { value: 'Gay', label: 'Gay' },
            { value: 'Lesbian', label: 'Lesbian' },
            { value: 'Pansexual', label: 'Pansexual' },
            { value: 'Straight', label: 'Straight' },
          ].map(({ value, label }) => (
            <label key={value}>
              <input
                type="checkbox"
                name="sexualOrientation"
                value={value}
                checked={formData.sexualOrientation?.includes(value) || false}
                onChange={(e) => handleDropdownChange('sexualOrientation', toggleValue(formData.sexualOrientation, e.target.value))}
              />
              {label}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={formData.sexualOrientation.length === 0}
              onChange={() => setFormData((prev) => ({ ...prev, sexualOrientation: [] }))}
            />
            Deselect All
          </label>
        </div>

        < br />

        <label>
          <strong>
            Match Type:
          </strong>
        </label>
        <div className="checkbox-group">
          {[
            { value: 'any', label: 'Match any' },
            { value: 'all', label: 'Match all' },
            { value: 'some', label: 'Match at least two' },
          ].map(({ value, label }) => (
            <label key={value}>
              <input
                type="radio"
                name="matchType"
                value={value}
                checked={formData.matchType === value}
                onChange={handleInputChange}
              />
              {label}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={formData.matchType === ''}
              onChange={() => setFormData((prev) => ({ ...prev, matchType: '' }))}
            />
            Deselect All
          </label>
        </div>

        <br />
        <input className={`round-btn ${theme}`} type="submit" value="Submit" disabled={isSubmitting} />
        <br />
        <br />
        <button
          className={`round-btn ${theme}`}
          type="button"
          onClick={handleRevertToSelectedFilters}
        >
          Revert to Selected Filters
        </button>

        <button
          className={`round-btn ${theme}`}
          type="button"
          onClick={handleClearAllFilters}
        >
          Clear All Filters
        </button>
      </form>

      <br />
      <button className={`round-btn ${theme}`} type="button" onClick={handleClearResults}>
        Clear Filtered Results
      </button>

      <button
        className={`round-btn ${theme}`} type="button"
        onClick={() => {
          if (setShowForm) setShowForm(false);
        }}
      >
        Cancel
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default UserConnectionsForms;