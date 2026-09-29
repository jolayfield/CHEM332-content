/**
 * 2D Particle in a Box — Contour / Heatmap Renderer
 *
 * ψ(x,y) = (2 / √(Lx·Ly)) · sin(nx·π·x/Lx) · sin(ny·π·y/Ly)
 * |ψ|²    = (4 / (Lx·Ly)) · sin²(nx·π·x/Lx) · sin²(ny·π·y/Ly)
 * E       = (h²/8mL²) · (nx²/Lx² + ny²/Ly²)
 *
 * Lx and Ly are dimensionless, in units of a reference length L, so
 * energies are reported in units of h²/8mL².
 */

/** Reduced energy E / (h²/8mL²) for state (nx, ny) in a box Lx × Ly (units of L) */
export function reducedEnergy(nx: number, ny: number, Lx: number, Ly: number): number {
    return (nx * nx) / (Lx * Lx) + (ny * ny) / (Ly * Ly);
}

/**
 * All states (nx, ny) with 1 ≤ nx, ny ≤ nMax whose energy equals that of
 * (nx0, ny0) within a relative tolerance. Includes (nx0, ny0) itself, so
 * the degeneracy g is the length of the returned list.
 */
export function findDegenerateStates(
    nx0: number, ny0: number, Lx: number, Ly: number, nMax = 15, relTol = 1e-9,
): [number, number][] {
    const E0 = reducedEnergy(nx0, ny0, Lx, Ly);
    const states: [number, number][] = [];
    for (let nx = 1; nx <= nMax; nx++) {
        for (let ny = 1; ny <= nMax; ny++) {
            if (Math.abs(reducedEnergy(nx, ny, Lx, Ly) - E0) <= relTol * E0) states.push([nx, ny]);
        }
    }
    return states;
}

export interface PIB2DParams {
    nx: number;
    ny: number;
    Lx: number;
    Ly: number;
    showProbability: boolean;
}

export class ParticleBox2DSimulation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width = 0;
    height = 0;

    // Grid resolution for heatmap computation
    private gridSize = 200;

    // Cached ImageData for the heatmap
    private heatmapData: ImageData | null = null;
    private lastParams: string = '';

    // Current parameters
    params: PIB2DParams = { nx: 1, ny: 1, Lx: 1, Ly: 1, showProbability: false };

    // Layout
    private plotLeft = 0;
    private plotTop = 0;
    private plotW = 0;
    private plotH = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D context not found');
        this.ctx = ctx;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (this.canvas.parentElement) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.lastParams = ''; // force recompute
            this.draw();
        }
    }

    /** Update parameters and redraw */
    update(p: Partial<PIB2DParams>) {
        Object.assign(this.params, p);
        this.draw();
    }

    // ── Wavefunction math ──────────────────────────────────────────

    private psi(x: number, y: number): number {
        const { nx, ny, Lx, Ly } = this.params;
        return (2 / Math.sqrt(Lx * Ly))
            * Math.sin(nx * Math.PI * x / Lx)
            * Math.sin(ny * Math.PI * y / Ly);
    }

    private psiSq(x: number, y: number): number {
        const v = this.psi(x, y);
        return v * v;
    }

    /** Energy in units of h²/8mL² */
    energy(): number {
        const { nx, ny, Lx, Ly } = this.params;
        return reducedEnergy(nx, ny, Lx, Ly);
    }

    // ── Colormaps ──────────────────────────────────────────────────

    /**
     * Diverging blue → white → red for wavefunction (range -1 … +1  mapped to t 0…1)
     */
    private colormapDiverging(t: number): [number, number, number] {
        // t ∈ [0, 1]  where 0.5 = zero
        if (t < 0.5) {
            // blue → white
            const s = t / 0.5; // 0→1
            const r = Math.round(30 + 225 * s);
            const g = Math.round(60 + 195 * s);
            const b = Math.round(200 + 55 * s);
            return [r, g, b];
        } else {
            // white → red
            const s = (t - 0.5) / 0.5; // 0→1
            const r = 255;
            const g = Math.round(255 - 195 * s);
            const b = Math.round(255 - 205 * s);
            return [r, g, b];
        }
    }

    /**
     * Sequential white → purple for probability density (range 0…1  mapped to t 0…1)
     */
    private colormapSequential(t: number): [number, number, number] {
        // white (255,255,255) → deep purple (52,14,81)
        const r = Math.round(255 - 203 * t);
        const g = Math.round(255 - 241 * t);
        const b = Math.round(255 - 174 * t);
        return [r, g, b];
    }

    // ── Rendering ──────────────────────────────────────────────────

    private computeLayout() {
        const padding = 60;
        const colorBarWidth = 50;
        const { Lx, Ly } = this.params;

        const availW = this.width - padding * 2 - colorBarWidth - 20;
        const availH = this.height - padding * 2;

        // Maintain aspect ratio Lx:Ly
        const aspect = Lx / Ly;
        if (availW / availH > aspect) {
            this.plotH = availH;
            this.plotW = this.plotH * aspect;
        } else {
            this.plotW = availW;
            this.plotH = this.plotW / aspect;
        }

        this.plotLeft = padding + (availW - this.plotW) / 2;
        this.plotTop = padding + (availH - this.plotH) / 2;
    }

    private computeHeatmap() {
        const key = JSON.stringify(this.params) + `|${this.width}|${this.height}`;
        if (key === this.lastParams && this.heatmapData) return;
        this.lastParams = key;

        this.computeLayout();

        const N = this.gridSize;
        const { Lx, Ly, showProbability } = this.params;

        // Compute values on grid
        const values: number[] = new Array(N * N);
        let vMin = Infinity, vMax = -Infinity;

        for (let j = 0; j < N; j++) {
            const y = (j + 0.5) / N * Ly;
            for (let i = 0; i < N; i++) {
                const x = (i + 0.5) / N * Lx;
                const v = showProbability ? this.psiSq(x, y) : this.psi(x, y);
                values[j * N + i] = v;
                if (v < vMin) vMin = v;
                if (v > vMax) vMax = v;
            }
        }

        // Make symmetric range for diverging
        if (!showProbability) {
            const absMax = Math.max(Math.abs(vMin), Math.abs(vMax));
            vMin = -absMax;
            vMax = absMax;
        } else {
            vMin = 0;
        }

        const range = vMax - vMin || 1;

        // Render to off-screen canvas then scale
        const offCanvas = document.createElement('canvas');
        offCanvas.width = N;
        offCanvas.height = N;
        const offCtx = offCanvas.getContext('2d')!;
        const imgData = offCtx.createImageData(N, N);

        for (let j = 0; j < N; j++) {
            for (let i = 0; i < N; i++) {
                const v = values[j * N + i];
                const t = (v - vMin) / range;
                const [r, g, b] = showProbability
                    ? this.colormapSequential(t)
                    : this.colormapDiverging(t);
                // Note: image top = y=Ly, bottom = y=0, so flip j
                const idx = ((N - 1 - j) * N + i) * 4;
                imgData.data[idx] = r;
                imgData.data[idx + 1] = g;
                imgData.data[idx + 2] = b;
                imgData.data[idx + 3] = 255;
            }
        }

        this.heatmapData = imgData;
        offCtx.putImageData(imgData, 0, 0);

        // Now draw scaled version to main canvas
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    draw() {
        if (this.width === 0 || this.height === 0) return;

        this.computeLayout();
        this.computeHeatmap();

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const { Lx, Ly, nx, ny, showProbability } = this.params;
        const N = this.gridSize;

        // ── Draw heatmap ──
        if (this.heatmapData) {
            const offCanvas = document.createElement('canvas');
            offCanvas.width = N;
            offCanvas.height = N;
            const offCtx = offCanvas.getContext('2d')!;
            offCtx.putImageData(this.heatmapData, 0, 0);

            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(offCanvas, this.plotLeft, this.plotTop, this.plotW, this.plotH);
            ctx.restore();
        }

        // Ink colors for the dark canvas background
        const inkLabel = 'rgba(255,255,255,0.75)';
        const inkSecondary = 'rgba(255,255,255,0.5)';

        // ── Box border ──
        ctx.strokeStyle = inkSecondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.plotLeft, this.plotTop, this.plotW, this.plotH);

        // ── Draw contour lines ──
        this.drawContourLines(ctx);

        // ── Axis labels ──
        ctx.fillStyle = inkSecondary;
        ctx.font = '12px Lato, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // x-axis ticks
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const frac = i / numTicks;
            const xPos = this.plotLeft + frac * this.plotW;
            const label = (frac * Lx).toFixed(1);
            ctx.fillText(label, xPos, this.plotTop + this.plotH + 8);
            // Tick mark
            ctx.beginPath();
            ctx.moveTo(xPos, this.plotTop + this.plotH);
            ctx.lineTo(xPos, this.plotTop + this.plotH + 5);
            ctx.strokeStyle = inkSecondary;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // y-axis ticks
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= numTicks; i++) {
            const frac = i / numTicks;
            const yPos = this.plotTop + this.plotH - frac * this.plotH;
            const label = (frac * Ly).toFixed(1);
            ctx.fillText(label, this.plotLeft - 8, yPos);
            ctx.beginPath();
            ctx.moveTo(this.plotLeft - 5, yPos);
            ctx.lineTo(this.plotLeft, yPos);
            ctx.strokeStyle = inkSecondary;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Axis titles
        ctx.fillStyle = inkLabel;
        ctx.font = 'italic 600 14px Lato, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('x / L', this.plotLeft + this.plotW / 2, this.plotTop + this.plotH + 28);

        ctx.save();
        ctx.translate(this.plotLeft - 40, this.plotTop + this.plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = 'middle';
        ctx.fillText('y / L', 0, 0);
        ctx.restore();

        // ── Title ──
        ctx.fillStyle = inkLabel;
        ctx.font = '600 14px Lato, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const title = showProbability
            ? `|ψ(x,y)|²   nx = ${nx}, ny = ${ny}`
            : `ψ(x,y)   nx = ${nx}, ny = ${ny}`;
        ctx.fillText(title, this.plotLeft + this.plotW / 2, this.plotTop - 12);

        // ── Color bar ──
        this.drawColorBar(ctx);
    }

    private drawContourLines(ctx: CanvasRenderingContext2D) {
        const { Lx, Ly, showProbability } = this.params;
        const N = 150; // lighter grid for contours

        // Compute field values
        const field: number[][] = [];
        let vMin = Infinity, vMax = -Infinity;
        for (let j = 0; j <= N; j++) {
            field[j] = [];
            const y = (j / N) * Ly;
            for (let i = 0; i <= N; i++) {
                const x = (i / N) * Lx;
                const v = showProbability ? this.psiSq(x, y) : this.psi(x, y);
                field[j][i] = v;
                if (v < vMin) vMin = v;
                if (v > vMax) vMax = v;
            }
        }

        if (!showProbability) {
            const absMax = Math.max(Math.abs(vMin), Math.abs(vMax));
            vMin = -absMax;
            vMax = absMax;
        } else {
            vMin = 0;
        }

        // Choose contour levels
        const levels: number[] = [];
        const numLevels = 8;
        for (let k = 1; k < numLevels; k++) {
            levels.push(vMin + (k / numLevels) * (vMax - vMin));
        }

        // Marching squares for each level
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.plotLeft, this.plotTop, this.plotW, this.plotH);
        ctx.clip();

        for (const level of levels) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.lineWidth = 0.8;

            for (let j = 0; j < N; j++) {
                for (let i = 0; i < N; i++) {
                    // Four corners
                    const v00 = field[j][i];
                    const v10 = field[j][i + 1];
                    const v01 = field[j + 1][i];
                    const v11 = field[j + 1][i + 1];

                    // Classify
                    const c = ((v00 >= level ? 8 : 0) |
                               (v10 >= level ? 4 : 0) |
                               (v11 >= level ? 2 : 0) |
                               (v01 >= level ? 1 : 0));

                    if (c === 0 || c === 15) continue;

                    // Interpolation helper
                    const lerp = (a: number, b: number) => {
                        const d = b - a;
                        return d === 0 ? 0.5 : (level - a) / d;
                    };

                    // Edge midpoints in grid coords
                    const topT = lerp(v00, v10);
                    const bottomT = lerp(v01, v11);
                    const leftT = lerp(v00, v01);
                    const rightT = lerp(v10, v11);

                    // To canvas coords
                    const toX = (gi: number) => this.plotLeft + (gi / N) * this.plotW;
                    const toY = (gj: number) => this.plotTop + this.plotH - (gj / N) * this.plotH;

                    const top = { x: toX(i + topT), y: toY(j) };
                    const bottom = { x: toX(i + bottomT), y: toY(j + 1) };
                    const left = { x: toX(i), y: toY(j + leftT) };
                    const right = { x: toX(i + 1), y: toY(j + rightT) };

                    // Draw segments based on case
                    const drawSeg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                    };

                    switch (c) {
                        case 1: case 14: drawSeg(left, bottom); break;
                        case 2: case 13: drawSeg(bottom, right); break;
                        case 3: case 12: drawSeg(left, right); break;
                        case 4: case 11: drawSeg(top, right); break;
                        case 5:
                            // Saddle: use average to decide
                            if ((v00 + v11) / 2 >= level) {
                                drawSeg(top, left); drawSeg(bottom, right);
                            } else {
                                drawSeg(top, right); drawSeg(bottom, left);
                            }
                            break;
                        case 6: case 9: drawSeg(top, bottom); break;
                        case 7: case 8: drawSeg(top, left); break;
                        case 10:
                            if ((v00 + v11) / 2 >= level) {
                                drawSeg(top, right); drawSeg(bottom, left);
                            } else {
                                drawSeg(top, left); drawSeg(bottom, right);
                            }
                            break;
                    }
                }
            }
            ctx.stroke();
        }

        // Draw nodal lines more prominently (level = 0) for wavefunction mode
        if (!showProbability) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            const level = 0;

            for (let j = 0; j < N; j++) {
                for (let i = 0; i < N; i++) {
                    const v00 = field[j][i];
                    const v10 = field[j][i + 1];
                    const v01 = field[j + 1][i];
                    const v11 = field[j + 1][i + 1];

                    const c = ((v00 >= level ? 8 : 0) |
                               (v10 >= level ? 4 : 0) |
                               (v11 >= level ? 2 : 0) |
                               (v01 >= level ? 1 : 0));

                    if (c === 0 || c === 15) continue;

                    const lerp = (a: number, b: number) => {
                        const d = b - a;
                        return d === 0 ? 0.5 : (level - a) / d;
                    };

                    const toX = (gi: number) => this.plotLeft + (gi / N) * this.plotW;
                    const toY = (gj: number) => this.plotTop + this.plotH - (gj / N) * this.plotH;

                    const topP = { x: toX(i + lerp(v00, v10)), y: toY(j) };
                    const bottomP = { x: toX(i + lerp(v01, v11)), y: toY(j + 1) };
                    const leftP = { x: toX(i), y: toY(j + lerp(v00, v01)) };
                    const rightP = { x: toX(i + 1), y: toY(j + lerp(v10, v11)) };

                    const drawSeg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                    };

                    switch (c) {
                        case 1: case 14: drawSeg(leftP, bottomP); break;
                        case 2: case 13: drawSeg(bottomP, rightP); break;
                        case 3: case 12: drawSeg(leftP, rightP); break;
                        case 4: case 11: drawSeg(topP, rightP); break;
                        case 5:
                            if ((v00 + v11) / 2 >= level) {
                                drawSeg(topP, leftP); drawSeg(bottomP, rightP);
                            } else {
                                drawSeg(topP, rightP); drawSeg(bottomP, leftP);
                            }
                            break;
                        case 6: case 9: drawSeg(topP, bottomP); break;
                        case 7: case 8: drawSeg(topP, leftP); break;
                        case 10:
                            if ((v00 + v11) / 2 >= level) {
                                drawSeg(topP, rightP); drawSeg(bottomP, leftP);
                            } else {
                                drawSeg(topP, leftP); drawSeg(bottomP, rightP);
                            }
                            break;
                    }
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    private drawColorBar(ctx: CanvasRenderingContext2D) {
        const barWidth = 20;
        const barHeight = this.plotH;
        const barLeft = this.plotLeft + this.plotW + 20;
        const barTop = this.plotTop;

        const { showProbability } = this.params;

        // Draw gradient bar
        for (let j = 0; j < barHeight; j++) {
            const t = 1 - j / barHeight; // top = 1, bottom = 0
            const [r, g, b] = showProbability
                ? this.colormapSequential(t)
                : this.colormapDiverging(t);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(barLeft, barTop + j, barWidth, 1);
        }

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barLeft, barTop, barWidth, barHeight);

        // Numeric tick labels: analytic extrema ψ_max = 2/√(LxLy), |ψ|²_max = 4/(LxLy)
        const { Lx, Ly } = this.params;
        const psiMax = 2 / Math.sqrt(Lx * Ly);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '11px Lato, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const tx = barLeft + barWidth + 5;

        if (showProbability) {
            ctx.fillText((psiMax * psiMax).toFixed(2), tx, barTop + 6);
            ctx.fillText('0', tx, barTop + barHeight - 2);
        } else {
            ctx.fillText(`+${psiMax.toFixed(2)}`, tx, barTop + 6);
            ctx.fillText('0', tx, barTop + barHeight / 2);
            ctx.fillText(`−${psiMax.toFixed(2)}`, tx, barTop + barHeight - 2);
        }

        // Units above the bar
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(showProbability ? '|ψ|² (L⁻²)' : 'ψ (L⁻¹)', barLeft + barWidth / 2, barTop - 6);
    }
}
