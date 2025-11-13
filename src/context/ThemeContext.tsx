'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to 'light' theme for GAMERHOUSE (retail/light aesthetic)
  const [theme, setTheme] = useState<ThemeType>('light');
  const [mounted, setMounted] = useState(false);

  // Load saved theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('gamerhouse-theme') as ThemeType | null;

    if (savedTheme) {
      setTheme(savedTheme);
    }
    // Default remains 'light' - GAMERHOUSE is a retail/light theme by default

    setMounted(true);
  }, []);

  // Guardar tema en localStorage
  const handleSetTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem('gamerhouse-theme', newTheme);
  };

  // Evitar hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
