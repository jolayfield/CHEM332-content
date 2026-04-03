/**
 * Capacitor App Initialization
 * Handles plugin configuration and platform-specific setup
 */

import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Initialize Capacitor plugins on app startup
 */
export async function initializeCapacitor(): Promise<void> {
  try {
    // Configure status bar
    await configureStatusBar();

    // Configure keyboard
    await configureKeyboard();

    console.log('Capacitor plugins initialized successfully');
  } catch (error) {
    console.warn('Capacitor initialization warning:', error);
    // Non-critical errors - app continues even if plugins unavailable
  }
}

/**
 * Configure the status bar appearance
 * Color is set based on system dark mode preference (light mode = purple, dark mode = dark gray)
 */
async function configureStatusBar(): Promise<void> {
  try {
    // Determine if dark mode is preferred
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set status bar color based on theme
    const statusBarColor = isDarkMode ? '#2d2d2d' : '#340E51';
    await StatusBar.setBackgroundColor({ color: statusBarColor });

    // Use light text on dark background
    await StatusBar.setStyle({ style: Style.Light });

    // On iOS, show overlays
    await StatusBar.setOverlaysWebView({ overlay: true });

    // Listen for system theme changes and update status bar
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
      const newColor = e.matches ? '#2d2d2d' : '#340E51';
      try {
        await StatusBar.setBackgroundColor({ color: newColor });
      } catch (error) {
        console.debug('Failed to update status bar color:', error);
      }
    });
  } catch (error) {
    // Status bar not available on web or if plugin fails
    console.debug('StatusBar plugin unavailable:', error);
  }
}

/**
 * Configure keyboard behavior
 */
async function configureKeyboard(): Promise<void> {
  try {
    // Show keyboard as needed (not resizing the view)
    await Keyboard.setScroll({ isDisabled: false });
  } catch (error) {
    // Keyboard plugin might not be available
    console.debug('Keyboard plugin unavailable:', error);
  }
}
