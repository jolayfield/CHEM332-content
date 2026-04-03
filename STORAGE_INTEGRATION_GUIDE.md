# Storage Integration Guide for Simulations

This guide explains how to add persistent state saving to any simulation using the Storage Manager.

## Quick Example: Adding Storage to a Simulation

### Step 1: Import Storage Functions
At the top of your simulation TypeScript file (e.g., `photoelectric.ts`):

```typescript
import { loadSimulationState, saveSimulationState } from './src/storage-manager';
```

### Step 2: Load Saved State on Startup
In your `DOMContentLoaded` event handler, after initializing variables:

```typescript
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('sim-canvas') as HTMLCanvasElement;

  // Define default parameters
  const defaultParams = {
    wavelength: 500,
    intensity: 100,
    metal: 'copper'
  };

  // Load saved state (or use defaults)
  const savedParams = await loadSimulationState('photoelectric', defaultParams);

  // Apply saved values to UI and simulation
  const wavelengthInput = document.getElementById('wavelength') as HTMLInputElement;
  wavelengthInput.value = String(savedParams.wavelength);
  // ... set other values
});
```

### Step 3: Save State When Parameters Change
In your parameter update handler:

```typescript
const updateUI = () => {
  const wavelength = parseInt(wavelengthInput.value);
  const intensity = parseInt(intensityInput.value);
  const metal = metalSelect.value;

  // Update simulation and UI
  sim.updateParams(wavelength, intensity, metal);
  graph.update(wavelength, intensity);

  // Save to persistent storage
  saveSimulationState('photoelectric', {
    wavelength,
    intensity,
    metal
  });
};

// Call updateUI whenever any control changes
wavelengthInput.addEventListener('change', updateUI);
intensityInput.addEventListener('change', updateUI);
metalSelect.addEventListener('change', updateUI);
```

## Storage Manager API Reference

### Basic Functions

#### `saveToStorage(key: string, value: any)`
Saves any JSON-serializable value to persistent storage.

```typescript
await saveToStorage('my-key', { data: 123, name: 'test' });
```

#### `loadFromStorage<T>(key: string, defaultValue: T)`
Loads a value from storage, returning the default if not found.

```typescript
const saved = await loadFromStorage('my-key', { data: 0, name: '' });
```

#### `removeFromStorage(key: string)`
Deletes a specific key from storage.

```typescript
await removeFromStorage('my-key');
```

#### `clearAllStorage()`
Clears all QuantumChem app data from storage.

```typescript
await clearAllStorage();
```

### Simulation-Specific Functions

#### `saveSimulationState(simulationName: string, params: Record<string, any>)`
Saves simulation parameters. Use this for consistency across all simulations.

```typescript
await saveSimulationState('bohr', { radius: 1, energy: -13.6 });
```

#### `loadSimulationState(simulationName: string, defaults: Record<string, any>)`
Loads previously saved simulation parameters.

```typescript
const state = await loadSimulationState('bohr', { radius: 1, energy: -13.6 });
```

### User Preference Functions

#### `saveUserPreferences(prefs: Record<string, any>)`
Saves app-wide user settings (e.g., theme, font size).

```typescript
await saveUserPreferences({ theme: 'dark', fontSize: 'large' });
```

#### `loadUserPreferences(defaults: Record<string, any>)`
Loads app-wide preferences.

```typescript
const prefs = await loadUserPreferences({ theme: 'light', fontSize: 'medium' });
```

### Lecture Functions

#### `saveLectureProgress(lectureId: string, progress: Record<string, any>)`
Saves reading progress for a lecture.

```typescript
await saveLectureProgress('week-01', {
  scrollPosition: 0.5,
  completed: false
});
```

#### `loadLectureProgress(lectureId: string)`
Loads lecture progress.

```typescript
const progress = await loadLectureProgress('week-01');
```

## Storage Keys

All storage keys are automatically prefixed with `quantumchem_` to avoid conflicts. For example:
- `saveToStorage('test', value)` → stores as `quantumchem_test`
- `saveSimulationState('bohr', data)` → stores as `quantumchem_sim_bohr`
- `saveUserPreferences(data)` → stores as `quantumchem_preferences`

## Error Handling

All storage functions have built-in error handling and will log warnings but not crash the app if storage fails (e.g., on web where storage may be limited).

```typescript
try {
  const data = await loadSimulationState('myapp', defaults);
  // Use data
} catch (error) {
  console.error('Storage error:', error);
  // Fallback to defaults already happened in loadSimulationState
}
```

## Platform Notes

- **iOS/Android (Capacitor)**: Data is stored in secure app-specific storage
- **Web**: Falls back to browser's localStorage if available
- **Data persists** across app restarts on mobile
- **Data is not synced** between devices (local storage only)

## Best Practices

1. **Load on startup**: Always restore saved state in `DOMContentLoaded`
2. **Save on change**: Call save functions whenever user changes a parameter
3. **Debounce if needed**: For frequently changing values (like sliders), consider debouncing saves to avoid excessive I/O
4. **Use defaults**: Always provide sensible default values when loading
5. **Keep keys consistent**: Use the same key for loading and saving the same data

## Example: Full Integration Pattern

```typescript
import { loadSimulationState, saveSimulationState } from './src/storage-manager';

const SIMULATION_NAME = 'example';
const DEFAULT_PARAMS = {
  param1: 100,
  param2: 50
};

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved state
  const params = await loadSimulationState(SIMULATION_NAME, DEFAULT_PARAMS);

  // Apply to UI
  const input1 = document.getElementById('param1') as HTMLInputElement;
  input1.value = String(params.param1);

  // Save whenever parameters change
  input1.addEventListener('change', async () => {
    await saveSimulationState(SIMULATION_NAME, {
      param1: parseInt(input1.value),
      param2: parseInt(input2.value)
    });
  });
});
```

## Adding Storage to Existing Simulations

To add storage to an existing simulation:

1. Import storage functions at the top
2. Create a DEFAULT_PARAMS constant
3. In DOMContentLoaded, load saved params before using them
4. Wrap parameter updates with saveSimulationState calls
5. Test on both web and mobile to ensure it works

See individual simulation files for examples as they are updated.
