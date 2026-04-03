/**
 * Storage Manager
 * Handles persistent data storage using Capacitor Preferences
 * Provides a simple interface for saving and loading app state
 */

import { Preferences } from '@capacitor/preferences';

const STORAGE_PREFIX = 'quantumchem_';
const VERSION_KEY = `${STORAGE_PREFIX}version`;
const CURRENT_VERSION = '1';

/**
 * Initialize storage system
 */
export async function initializeStorage(): Promise<void> {
  try {
    const versionResult = await Preferences.get({ key: VERSION_KEY });
    const storedVersion = versionResult.value || '';

    if (storedVersion !== CURRENT_VERSION) {
      // Migration logic here if needed in future
      await Preferences.set({ key: VERSION_KEY, value: CURRENT_VERSION });
    }
  } catch (error) {
    console.debug('Storage initialization:', error);
  }
}

/**
 * Save a value to persistent storage
 * @param key - Storage key (without prefix)
 * @param value - Value to store (any JSON-serializable type)
 */
export async function saveToStorage(key: string, value: any): Promise<void> {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    const jsonValue = JSON.stringify(value);
    await Preferences.set({ key: fullKey, value: jsonValue });
  } catch (error) {
    console.warn(`Failed to save ${key} to storage:`, error);
  }
}

/**
 * Load a value from persistent storage
 * @param key - Storage key (without prefix)
 * @param defaultValue - Value to return if key not found
 * @returns Stored value or default value
 */
export async function loadFromStorage<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    const result = await Preferences.get({ key: fullKey });

    if (result.value === null) {
      return defaultValue;
    }

    return JSON.parse(result.value);
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
}

/**
 * Remove a value from persistent storage
 * @param key - Storage key (without prefix)
 */
export async function removeFromStorage(key: string): Promise<void> {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    await Preferences.remove({ key: fullKey });
  } catch (error) {
    console.warn(`Failed to remove ${key} from storage:`, error);
  }
}

/**
 * Clear all app storage
 */
export async function clearAllStorage(): Promise<void> {
  try {
    // Get all keys and remove those with our prefix
    const allKeys = await Preferences.keys();

    for (const key of allKeys.keys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        await Preferences.remove({ key });
      }
    }

    console.log('All app storage cleared');
  } catch (error) {
    console.warn('Failed to clear storage:', error);
  }
}

/**
 * Save simulation parameters
 * @param simulationName - Name of the simulation (e.g., 'photoelectric', 'bohr')
 * @param params - Object containing simulation parameters
 */
export async function saveSimulationState(
  simulationName: string,
  params: Record<string, any>
): Promise<void> {
  return saveToStorage(`sim_${simulationName}`, params);
}

/**
 * Load simulation parameters
 * @param simulationName - Name of the simulation
 * @param defaults - Default parameters if not found
 * @returns Saved parameters or defaults
 */
export async function loadSimulationState(
  simulationName: string,
  defaults: Record<string, any>
): Promise<Record<string, any>> {
  return loadFromStorage(`sim_${simulationName}`, defaults);
}

/**
 * Save the last viewed page
 * @param pageName - Name of the page/simulation
 */
export async function saveLastViewedPage(pageName: string): Promise<void> {
  return saveToStorage('last_page', pageName);
}

/**
 * Load the last viewed page
 * @returns Name of the last viewed page, or 'index' if not found
 */
export async function loadLastViewedPage(): Promise<string> {
  return loadFromStorage('last_page', 'index');
}

/**
 * Save user preferences
 * @param prefs - Preference object (e.g., { theme: 'dark', fontSize: 'large' })
 */
export async function saveUserPreferences(
  prefs: Record<string, any>
): Promise<void> {
  return saveToStorage('preferences', prefs);
}

/**
 * Load user preferences
 * @param defaults - Default preferences
 * @returns Saved preferences or defaults
 */
export async function loadUserPreferences(
  defaults: Record<string, any>
): Promise<Record<string, any>> {
  return loadFromStorage('preferences', defaults);
}

/**
 * Save lecture reading progress
 * @param lectureId - Lecture identifier
 * @param progress - Progress object (e.g., { scrollPosition: 0.5, completed: false })
 */
export async function saveLectureProgress(
  lectureId: string,
  progress: Record<string, any>
): Promise<void> {
  return saveToStorage(`lecture_${lectureId}`, progress);
}

/**
 * Load lecture reading progress
 * @param lectureId - Lecture identifier
 * @returns Progress object or defaults
 */
export async function loadLectureProgress(
  lectureId: string
): Promise<Record<string, any>> {
  return loadFromStorage(`lecture_${lectureId}`, {
    scrollPosition: 0,
    completed: false,
    lastViewed: new Date().toISOString()
  });
}
