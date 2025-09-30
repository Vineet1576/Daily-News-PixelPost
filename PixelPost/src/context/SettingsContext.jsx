import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  darkMode: false,
  notifications: true,
  language: 'en',
  region: 'world',
  fontSize: 'medium',
  compactMode: false,
  autoRefresh: false,
  password: ''
};

const SettingsContext = createContext({
  settings: defaultSettings,
  setSettings: () => {}
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
