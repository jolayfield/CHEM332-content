
import Chart from 'chart.js/auto';

export class KEGraph {
    canvas: HTMLCanvasElement;
    chart: Chart;

    // Physics Constants for Graphing
    // K max = hf - Phi
    // Slope = h
    // Intercept = -Phi
    // We plot KE (y) vs Frequency (x)

    // Frequency range to show
    minFreq: number = 0;
    maxFreq: number = 2000; // THz

    // Physics Scaling
    // h is 4.1357e-15 eV*s (eV / Hz)
    h_val = 4.1357e-15; // eV / Hz

    mode: 'wavelength' | 'frequency' = 'wavelength';
    currentPhi: number = 2.0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const _style = getComputedStyle(document.documentElement);
        const _accent = _style.getPropertyValue('--accent').trim() || '#340E51';
        const _ink3  = _style.getPropertyValue('--ink-3').trim()  || '#7b7681';
        const _line  = _style.getPropertyValue('--line').trim()   || '#d9d2c5';
        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Theoretical Max KE',
                        data: [], // Curve
                        borderColor: _accent,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        order: 2
                    },
                    {
                        label: 'Current State',
                        data: [], // multiple points
                        backgroundColor: [], // per-point colors pushed via update()
                        // color comes from wavelengthToColor in photoelectric.ts
                        borderColor: 'transparent',
                        borderWidth: 0,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        type: 'scatter',
                        order: 1
                    },
                    {
                        label: 'Zero Line',
                        data: [{ x: 200, y: 0 }, { x: 1000, y: 0 }],
                        borderColor: _line,
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        fill: false,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Wavelength \u03BB (nm)',
                            color: _ink3
                        },
                        grid: {
                            color: _line
                        },
                        ticks: {
                            color: _ink3,
                            stepSize: 100
                        },
                        min: 200,
                        max: 1000
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Max Kinetic Energy (eV)',
                            color: _ink3
                        },
                        grid: {
                            color: (ctx) => ctx.tick.value === 0 ? _ink3 : _line,
                            lineWidth: (ctx) => ctx.tick.value === 0 ? 1.5 : 1
                        },
                        ticks: {
                            color: _ink3,
                            callback: function (val) {
                                return Number(val) < 0 ? '' : val;
                            }
                        },
                        min: -0.5
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    setMode(mode: 'wavelength' | 'frequency') {
        if (this.mode === mode) return;
        this.mode = mode;

        // Transform Data Points
        // Constant K = c * 1e9 (nm/s) * 1e-12 (THz)?? No.
        // Relation: f(Hz) = c / lambda(m) = 2.998e17 / lambda(nm)
        // Relation: lambda(nm) = 2.998e17 / f(Hz)
        // So x_new = 2.99792e17 / x_old
        const K = 2.99792458e17;

        const scatter = this.chart.data.datasets[1];
        scatter.data = (scatter.data as any[]).map(p => ({
            x: K / p.x,
            y: p.y
        }));

        // Update Scales & Zero Line
        const xScale = this.chart.options.scales!.x as any;

        if (mode === 'wavelength') {
            xScale.title.text = 'Wavelength \u03BB (nm)';
            xScale.min = 200;
            xScale.max = 1000;
            // @ts-ignore
            xScale.ticks.callback = undefined; // use default

            this.chart.data.datasets[2].data = [{ x: 200, y: 0 }, { x: 1000, y: 0 }];
        } else {
            xScale.title.text = 'Frequency \u03BD (Hz)';
            xScale.min = 0;
            xScale.max = 2.0e15;
            // @ts-ignore
            xScale.ticks.callback = function (val) { return Number(val).toExponential(1); };

            this.chart.data.datasets[2].data = [{ x: 0, y: 0 }, { x: 2.0e15, y: 0 }];
        }

        this.redrawTheoretical();
        this.chart.update();
    }

    redrawTheoretical() {
        if (this.mode === 'wavelength') {
            const curveData = [];

            // Cutoff wavelength where E = Phi -> 1239.8 / w = Phi -> w = 1239.8 / Phi
            const cutoffWavelength = 1239.8 / this.currentPhi;

            for (let w = 200; w <= 1000; w += 10) {
                if (w < cutoffWavelength) {
                    const energy = 1239.8 / w;
                    curveData.push({ x: w, y: energy - this.currentPhi });
                } else {
                    // We reached the limit where K=0. Add the exact point and stop.
                    curveData.push({ x: cutoffWavelength, y: 0 });
                    break;
                }
            }

            // Edge case: if cutoff > 1000, ensuring we didn't miss the last segment connecting to a theoretical cutoff is handled by the loop naturally including up to 1000.

            this.chart.data.datasets[0].data = curveData;
        } else {
            // Threshold frequency: h*f = Phi -> f = Phi / h
            // h in eV/Hz
            const thresholdFreq = this.currentPhi / this.h_val;

            const lineData = [
                { x: thresholdFreq, y: 0 },
                { x: 2.0e15, y: (this.h_val * 2.0e15) - this.currentPhi }
            ];
            this.chart.data.datasets[0].data = lineData;
        }
    }


    update(frequencyTHz: number, workFunction: number, color: string) {
        try {
            this.currentPhi = workFunction;

            // Calculate Values
            const freqHz = frequencyTHz * 1e12;
            const wl_nm = 299792.458 / frequencyTHz;

            const photonEnergy = 1239.8 / wl_nm; // or h*f
            let currentKE = photonEnergy - workFunction;
            if (currentKE < 0) currentKE = 0;

            // Determine X based on mode
            const xVal = this.mode === 'wavelength' ? wl_nm : freqHz;

            // Redraw Theoretical (always fresh)
            this.redrawTheoretical();
            this.chart.data.datasets[0].label = `Phi = ${workFunction} eV`;

            // Add Point (cap to prevent unbounded accumulation)
            const MAX_POINTS = 500;
            const newPoint = { x: xVal, y: currentKE };
            const scatterDataset = this.chart.data.datasets[1];
            if (!Array.isArray(scatterDataset.backgroundColor)) {
                scatterDataset.backgroundColor = [];
            }
            const pts = scatterDataset.data as any[];
            const colors = scatterDataset.backgroundColor as string[];
            if (pts.length >= MAX_POINTS) {
                pts.shift();
                colors.shift();
            }
            pts.push(newPoint);
            colors.push(color);

            this.chart.update();
        } catch (e) {
            console.error("Error updating graph:", e);
        }
    }

    reset() {
        try {
            // Clear Points from Scatter (index 1)
            const scatter = this.chart.data.datasets[1];
            if (scatter) {
                scatter.data = [];
                scatter.backgroundColor = [];
            }

            this.chart.update();
        } catch (e) {
            console.error("Error resetting graph:", e);
        }
    }
}
