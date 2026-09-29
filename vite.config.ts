import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Use relative paths for assets to ensure they load on GitHub Pages
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html',
                simulations: 'simulations.html',
                photoelectric: 'photoelectric.html',
                blackbody: 'blackbody.html',
                bohr: 'bohr.html',
                particlebox: 'particlebox.html',
                barrier: 'barrier.html',
                orbitals: 'atomic-orbitals.html',
                'mo-scheme': 'mo-scheme.html',
                particlebox2d: 'particlebox2d.html',
                hybridization: 'hybridization.html',
                'ir-spectra': 'ir-spectra.html',
                'rot-spectra': 'rot-spectra.html',
                'vibrot-spectra': 'vibrot-spectra.html',
            },
            output: {
                manualChunks: {
                    'chart-vendor': ['chart.js/auto'],
                },
            },
        },
    }
});
