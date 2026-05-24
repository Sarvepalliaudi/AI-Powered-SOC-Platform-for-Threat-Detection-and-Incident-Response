import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('soc_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('soc_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.className = `${theme === 'dark' ? 'theme-dark' : 'theme-light'} antialiased transition-colors duration-300`;
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, theme: darkMode ? 'dark' : 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
