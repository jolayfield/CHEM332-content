export class ParticleBoxSimulation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    // State
    pinnedStates: { n: number, c: number }[] = [];
    previewN: number = 1;
    boxWidth: number = 1.0; // nm (display units)
    showProbability: boolean = false;
    animationSpeed: number = 1.0;

    // Animation
    time: number = 0;
    lastTimestamp: number = 0;
    isAnimating: boolean = false;

    // Layout
    boxLeft: number = 0;
    boxRight: number = 0;
    boxTop: number = 0;
    boxBottom: number = 0;
    waveBaseline: number = 0;

    // Cached wall gradients (invalidated on resize)
    private wallGradL: CanvasGradient | null = null;
    private wallGradR: CanvasGradient | null = null;
    private cachedBoxLeft: number = -1;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("2D context not found");
        this.ctx = ctx;

        this.width = canvas.width;
        this.height = canvas.height;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    handleResize() {
        if (this.canvas.parentElement) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.updateLayout();
        }
    }

    updateLayout() {
        const padding = 40;
        this.boxLeft = padding + 40;
        this.boxRight = this.width - padding - 40;
        this.boxTop = padding;
        this.boxBottom = this.height - padding;
        this.waveBaseline = this.height / 2;
    }

    // ψ_n(x) = sqrt(2/L) * sin(nπx/L)
    // Normalized x in [0, 1] for the box
    psi(n: number, x: number): number {
        return Math.sqrt(2) * Math.sin(n * Math.PI * x);
    }

    // E_n proportional to n² (in arbitrary units for animation)
    energy(n: number): number {
        return n * n;
    }

    update(dt: number) {
        if (this.isAnimating) {
            this.time += dt * 0.001 * this.animationSpeed;
        }
    }

    resetTime() {
        this.time = 0;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const ctx = this.ctx;

        const boxW = this.boxRight - this.boxLeft;
        const boxH = this.boxBottom - this.boxTop;

        // Draw potential well walls
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Left wall
        ctx.beginPath();
        ctx.moveTo(this.boxLeft, this.boxTop);
        ctx.lineTo(this.boxLeft, this.boxBottom);
        ctx.stroke();

        // Right wall
        ctx.beginPath();
        ctx.moveTo(this.boxRight, this.boxTop);
        ctx.lineTo(this.boxRight, this.boxBottom);
        ctx.stroke();

        // Bottom (V=0 reference)
        ctx.beginPath();
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(this.boxLeft, this.waveBaseline);
        ctx.lineTo(this.boxRight, this.waveBaseline);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wall shading (infinite potential) — gradients cached until resize
        if (this.cachedBoxLeft !== this.boxLeft) {
            this.wallGradL = ctx.createLinearGradient(this.boxLeft - 40, 0, this.boxLeft, 0);
            this.wallGradL.addColorStop(0, 'rgba(45, 52, 54, 0.3)');
            this.wallGradL.addColorStop(1, 'rgba(45, 52, 54, 0.05)');
            this.wallGradR = ctx.createLinearGradient(this.boxRight, 0, this.boxRight + 40, 0);
            this.wallGradR.addColorStop(0, 'rgba(45, 52, 54, 0.05)');
            this.wallGradR.addColorStop(1, 'rgba(45, 52, 54, 0.3)');
            this.cachedBoxLeft = this.boxLeft;
        }
        ctx.fillStyle = this.wallGradL!;
        ctx.fillRect(this.boxLeft - 40, this.boxTop, 40, boxH);
        ctx.fillStyle = this.wallGradR!;
        ctx.fillRect(this.boxRight, this.boxTop, 40, boxH);

        // V=∞ labels
        ctx.fillStyle = '#636e72';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('V = ∞', this.boxLeft - 20, this.boxTop + 20);
        ctx.fillText('V = ∞', this.boxRight + 20, this.boxTop + 20);
        ctx.fillText('V = 0', this.boxLeft + boxW / 2, this.boxBottom + 20);

        // Adjust scaling: probability density peaks are higher (up to 2*N) than Re(psi) (up to sqrt(2*N))
        const numPoints = 300;
        const amplitude = this.showProbability ? boxH * 0.12 : boxH * 0.35;

        this.drawWavefunction(ctx, numPoints, amplitude);

        // Draw x-axis labels
        ctx.fillStyle = '#636e72';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('0', this.boxLeft, this.boxBottom + 35);
        ctx.fillText('L', this.boxRight, this.boxBottom + 35);

        // Draw title
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 14px Merriweather';
        ctx.textAlign = 'center';

        // Create a list of all active states for drawing: pinned + preview
        // preview coefficient is assumed to be 1.0 for visualization
        const allStates = [...this.pinnedStates.map(s => ({ n: s.n, c: s.c }))];
        if (!this.pinnedStates.some(s => s.n === this.previewN)) {
            allStates.push({ n: this.previewN, c: 1.0 });
        }
        allStates.sort((a, b) => a.n - b.n);

        let title = "";
        if (this.showProbability) {
            if (allStates.length === 1) {
                title = `|ψ${this.subscript(allStates[0].n)}(x)|²`;
            } else {
                title = `|Σ cₙψₙ|²`;
            }
        } else {
            if (allStates.length === 1) {
                title = `ψ${this.subscript(allStates[0].n)}(x, t)`;
            } else {
                title = `Re(Σ cₙψₙe^{-iωₙt})`;
            }
        }
        ctx.fillText(title, this.boxLeft + boxW / 2, this.boxTop - 15);
    }

    subscript(n: number): string {
        const subs = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈'];
        return subs[n] || `${n}`;
    }

    drawWavefunction(ctx: CanvasRenderingContext2D, numPoints: number, amplitude: number) {
        const boxW = this.boxRight - this.boxLeft;

        // Combine pinned states and preview
        const allStates = [...this.pinnedStates.map(s => ({ n: s.n, c: s.c }))];
        if (!this.pinnedStates.some(s => s.n === this.previewN)) {
            allStates.push({ n: this.previewN, c: 1.0 });
        }

        if (allStates.length === 0) return;

        // Normalization factor A = 1 / sqrt(sum |c_n|^2)
        const sumSqC = allStates.reduce((acc, s) => acc + s.c * s.c, 0);
        const norm = 1 / Math.sqrt(sumSqC);

        if (this.showProbability) {
            ctx.beginPath();
            ctx.moveTo(this.boxLeft, this.waveBaseline);

            for (let i = 0; i <= numPoints; i++) {
                const frac = i / numPoints;
                const x = this.boxLeft + frac * boxW;

                let re = 0;
                let im = 0;
                for (const state of allStates) {
                    const psiVal = this.psi(state.n, frac);
                    const omega = this.energy(state.n);
                    const cn = state.c * norm;
                    re += cn * psiVal * Math.cos(omega * this.time);
                    im += cn * psiVal * Math.sin(omega * this.time);
                }

                const prob = re * re + im * im;
                const y = this.waveBaseline - prob * amplitude;
                ctx.lineTo(x, y);
            }

            ctx.lineTo(this.boxRight, this.waveBaseline);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, this.waveBaseline - amplitude, 0, this.waveBaseline);
            const color = allStates.length > 1 ? 'rgba(156, 39, 176, 0.4)' : 'rgba(61, 90, 254, 0.4)';
            const colorLight = allStates.length > 1 ? 'rgba(156, 39, 176, 0.05)' : 'rgba(61, 90, 254, 0.05)';
            grad.addColorStop(0, color);
            grad.addColorStop(1, colorLight);
            ctx.fillStyle = grad;
            ctx.fill();

            // Outline
            ctx.beginPath();
            ctx.moveTo(this.boxLeft, this.waveBaseline);
            for (let i = 0; i <= numPoints; i++) {
                const frac = i / numPoints;
                const x = this.boxLeft + frac * boxW;
                let re = 0;
                let im = 0;
                for (const state of allStates) {
                    const psiVal = this.psi(state.n, frac);
                    const omega = this.energy(state.n);
                    const cn = state.c * norm;
                    re += cn * psiVal * Math.cos(omega * this.time);
                    im += cn * psiVal * Math.sin(omega * this.time);
                }
                const prob = re * re + im * im;
                const y = this.waveBaseline - prob * amplitude;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = allStates.length > 1 ? '#9c27b0' : '#3d5afe';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        } else {
            ctx.beginPath();
            for (let i = 0; i <= numPoints; i++) {
                const frac = i / numPoints;
                const x = this.boxLeft + frac * boxW;

                let val = 0;
                for (const state of allStates) {
                    val += (state.c * norm) * this.psi(state.n, frac) * Math.cos(this.energy(state.n) * this.time);
                }

                const y = this.waveBaseline - val * amplitude;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.strokeStyle = allStates.length > 1 ? '#9c27b0' : '#3d5afe';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Positive/Negative fills
            ctx.beginPath();
            ctx.moveTo(this.boxLeft, this.waveBaseline);
            for (let i = 0; i <= numPoints; i++) {
                const frac = i / numPoints;
                const x = this.boxLeft + frac * boxW;
                let val = 0;
                for (const state of allStates) {
                    val += (state.c * norm) * this.psi(state.n, frac) * Math.cos(this.energy(state.n) * this.time);
                }
                const y = this.waveBaseline - val * amplitude;
                ctx.lineTo(x, Math.min(y, this.waveBaseline));
            }
            ctx.lineTo(this.boxRight, this.waveBaseline);
            ctx.closePath();
            ctx.fillStyle = allStates.length > 1 ? 'rgba(156, 39, 176, 0.12)' : 'rgba(61, 90, 254, 0.12)';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.boxLeft, this.waveBaseline);
            for (let i = 0; i <= numPoints; i++) {
                const frac = i / numPoints;
                const x = this.boxLeft + frac * boxW;
                let val = 0;
                for (const state of allStates) {
                    val += (state.c * norm) * this.psi(state.n, frac) * Math.cos(this.energy(state.n) * this.time);
                }
                const y = this.waveBaseline - val * amplitude;
                ctx.lineTo(x, Math.max(y, this.waveBaseline));
            }
            ctx.lineTo(this.boxRight, this.waveBaseline);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 64, 129, 0.12)';
            ctx.fill();
        }
    }

    loop(timestamp: number) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const dt = Math.min(timestamp - this.lastTimestamp, 100);
        this.lastTimestamp = timestamp;

        if (!document.hidden) {
            this.update(dt);
            this.draw();
        }
        requestAnimationFrame(this.loop);
    }
}

export class ParticleBoxEnergyDiagram {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    activeStates: number[] = [1];
    maxN: number = 8;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("2D context not found");
        this.ctx = ctx;

        this.width = canvas.width;
        this.height = canvas.height;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (this.canvas.parentElement) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight || 200;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.draw();
        }
    }

    getY(n: number): number {
        // E_n ∝ n², map n=1 to bottom, n=8 to top
        const e = n * n;
        const maxE = this.maxN * this.maxN;
        const normalize = e / maxE;
        return this.height - 30 - (normalize * (this.height - 60));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const ctx = this.ctx;

        const paddingLeft = 50;
        const lineWidth = this.width - 70;

        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Draw energy levels
        for (let n = 1; n <= this.maxN; n++) {
            const y = this.getY(n);
            const isActive = this.activeStates.includes(n);

            ctx.beginPath();
            ctx.strokeStyle = isActive ? '#9c27b0' : '#ddd';
            ctx.lineWidth = isActive ? 2.5 : 1;
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(paddingLeft + lineWidth, y);
            ctx.stroke();

            // Label
            ctx.fillStyle = isActive ? '#9c27b0' : '#999';
            ctx.font = isActive ? 'bold 12px Arial' : '12px Arial';
            ctx.fillText(`n=${n}`, paddingLeft - 5, y);

            // Energy value (E_n = n² in units of E₁)
            ctx.textAlign = 'left';
            ctx.fillText(`${n * n} E₁`, paddingLeft + lineWidth + 5, y);
            ctx.textAlign = 'right';

            // Marker
            if (isActive) {
                ctx.beginPath();
                ctx.fillStyle = '#9c27b0';
                ctx.arc(paddingLeft + lineWidth / 2, y, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
