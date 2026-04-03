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
 */
async function configureStatusBar(): Promise<void> {
  try {
    // Set status bar color to match app theme (dark purple)
    await StatusBar.setBackgroundColor({ color: '#340E51' });

    // Use light text on dark background
    await StatusBar.setStyle({ style: Style.Light });

    // On iOS, show overlays
    await StatusBar.setOverlaysWebView({ overlay: true });
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
