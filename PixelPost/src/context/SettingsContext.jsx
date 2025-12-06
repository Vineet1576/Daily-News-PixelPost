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

  // Apply dark mode class to document root for Tailwind dark variants
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (settings.darkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (e) {
      // ignore during SSR or non-browser env
    }
  }, [settings.darkMode]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
