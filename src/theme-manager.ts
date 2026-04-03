/**
 * Theme Manager
 * Handles dark mode and light mode switching
 * Supports system preference detection and manual override with persistence
 */

import { loadFromStorage, saveToStorage } from './storage-manager';

type Theme = 'light' | 'dark';

/**
 * Initialize theme on app load
 * Checks saved preference first, then falls back to system preference
 * Listens for system preference changes and updates if no manual override is set
 */
export async function initializeTheme(): Promise<void> {
  // Load saved theme preference (if user manually chose)
  const savedTheme = await loadThemePreference();

  if (savedTheme) {
    // User has manually set a preference
    applyTheme(savedTheme);
  } else {
    // No manual preference, use system preference
    const systemTheme = getSystemThemePreference();
    applyTheme(systemTheme);

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }
}

/**
 * Toggle between light and dark theme
 * Saves the preference so it persists across reloads
 */
export async function toggleTheme(): Promise<void> {
  const currentTheme = document.documentElement.getAttribute('data-theme') as Theme || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  await saveThemePreference(newTheme);
}

/**
 * Apply a theme to the document
 * Sets the data-theme attribute on the root element
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);

  // Update status bar for mobile if available
  updateStatusBarForTheme(theme);
}

/**
 * Get the system's color scheme preference
 */
function getSystemThemePreference(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Load the saved theme preference from storage
 */
async function loadThemePreference(): Promise<Theme | null> {
  return loadFromStorage<Theme | null>('theme-preference', null);
}

/**
 * Save the theme preference to storage
 */
async function saveThemePreference(theme: Theme): Promise<void> {
  await saveToStorage('theme-preference', theme);
}

/**
 * Update the status bar color based on theme
 * Only applies on mobile platforms (Capacitor available)
 */
async function updateStatusBarForTheme(theme: Theme): Promise<void> {
  try {
    // Dynamically import only if Capacitor is available
    const { StatusBar, Style } = await import('@capacitor/status-bar');

    const bgColor = theme === 'dark' ? '#2d2d2d' : '#340E51';
    await StatusBar.setBackgroundColor({ color: bgColor });
    await StatusBar.setStyle({ style: Style.Light });
  } catch (error) {
    // StatusBar plugin not available (running in browser)
    console.debug('StatusBar plugin unavailable, skipping status bar update');
  }
}

/**
 * Get the current theme (useful for components that need to know the theme)
 */
export function getCurrentTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
}
