// frontend/src/components/UseState/UseState.jsx

import './UseState.css';

const UseState = ({ setTheme }) => {
  const handleThemeChange = (theme) => {
    setTheme(theme);
    localStorage.setItem('theme', theme);
  };

  return (
    <div className="state">
      <p className="toggle-theme-label">Toggle Theme</p>
      <div className="theme-buttons">
        <button type="button" className="dark-theme-toggle-btn" onClick={() => handleThemeChange('dark')}>Dark</button>
        <button type="button" className="light-theme-toggle-btn" onClick={() => handleThemeChange('light')}>Light</button>
        <button type="button" className="green-theme-toggle-btn" onClick={() => handleThemeChange('green')}>Green</button>
        <button type="button" className="blue-theme-toggle-btn" onClick={() => handleThemeChange('blue')}>Blue</button>
        <button type="button" className="red-theme-toggle-btn" onClick={() => handleThemeChange('red')}>Red</button>
        <button type="button" className="purple-theme-toggle-btn" onClick={() => handleThemeChange('purple')}>Purple</button>
      </div>
    </div>
  );
};

export default UseState;