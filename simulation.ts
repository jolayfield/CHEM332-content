
interface Photon {
    x: number;
    y: number;
    dx: number;
    dy: number;
    energy: number;
}

interface Electron {
    x: number;
    y: number;
    dx: number;
    dy: number;
    ke: number;
}

const MAX_PHOTONS = 40;
const MAX_ELECTRONS = 30;

const METAL_SYMBOLS: Record<string, string> = {
    'Cesium': 'Cs', 'Sodium': 'Na', 'Copper': 'Cu', 'Gold': 'Au'
};

export class Simulation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    photons: Photon[];
    electrons: Electron[];

    // Physics state
    wavelength: number; // nm
    intensity: number;  // %
    workFunction: number; // eV
    voltage: number;
    metalName: string = 'Cesium';

    hc_eV_nm: number = 1239.8;

    // Layout — vertical plate on left side
    plateX: number = 0;
    plateY: number = 0;
    plateH: number = 0;
    readonly plateW: number = 14;
    lastTime: number = 0;
    metalY: number = 0; // kept for API compat
    gridCanvas: HTMLCanvasElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2D context");
        this.ctx = ctx;

        this.width = canvas.width;
        this.height = canvas.height;
        this.photons = [];
        this.electrons = [];

        this.wavelength = 500;
        this.intensity = 50;
        this.workFunction = 2.1;
        this.voltage = 0;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    handleResize(): void {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            this.plateX = Math.round(this.width * 0.08);
            this.plateY = Math.round(this.height * 0.25);
            this.plateH = Math.round(this.height * 0.5);
            this.metalY = this.plateY;
            this.buildGrid();
        }
    }

    buildGrid(): void {
        const gc = document.createElement('canvas');
        gc.width = this.width;
        gc.height = this.height;
        const gctx = gc.getContext('2d')!;
        gctx.fillStyle = '#080c10';
        gctx.fillRect(0, 0, gc.width, gc.height);
        gctx.strokeStyle = 'rgba(255,255,255,0.05)';
        gctx.lineWidth = 0.5;
        gctx.beginPath();
        for (let x = 0; x <= this.width; x += 24) {
            gctx.moveTo(x, 0);
            gctx.lineTo(x, this.height);
        }
        for (let y = 0; y <= this.height; y += 24) {
            gctx.moveTo(0, y);
            gctx.lineTo(this.width, y);
        }
        gctx.stroke();
        this.gridCanvas = gc;
    }

    updateParams(wavelength: number, intensity: number, workFunc: number, metalName: string): void {
        this.wavelength = wavelength;
        this.intensity = intensity;
        this.workFunction = workFunc;
        this.metalName = metalName;
    }

    getPhotonEnergy(): number {
        return this.hc_eV_nm / this.wavelength;
    }

    getFrequency(): number {
        return 299792.458 / this.wavelength;
    }

    wavelengthToColor(wl_nm: number): string {
        let r = 0, g = 0, b = 0;

        if (wl_nm >= 380 && wl_nm < 440) {
            r = -(wl_nm - 440) / (440 - 380); g = 0; b = 1;
        } else if (wl_nm >= 440 && wl_nm < 490) {
            r = 0; g = (wl_nm - 440) / (490 - 440); b = 1;
        } else if (wl_nm >= 490 && wl_nm < 510) {
            r = 0; g = 1; b = -(wl_nm - 510) / (510 - 490);
        } else if (wl_nm >= 510 && wl_nm < 580) {
            r = (wl_nm - 510) / (580 - 510); g = 1; b = 0;
        } else if (wl_nm >= 580 && wl_nm < 645) {
            r = 1; g = -(wl_nm - 645) / (645 - 580); b = 0;
        } else if (wl_nm >= 645 && wl_nm <= 780) {
            r = 1; g = 0; b = 0;
        }

        if (wl_nm < 380) return 'rgba(255, 255, 255, 0.85)';
        if (wl_nm > 780) return 'rgba(200, 0, 0, 0.3)';

        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.8)`;
    }

    spawnPhoton(): void {
        if (this.photons.length >= MAX_PHOTONS) return;
        const spawnRate = this.intensity / 20;
        if (Math.random() < 0.1 * spawnRate) {
            const plateMidY = this.plateY + this.plateH / 2;
            const targetY = plateMidY + (Math.random() - 0.5) * this.plateH * 0.7;
            const spawnX = this.width - 10;
            // Spawn in the upper portion, angled down toward the plate
            const spawnY = this.plateY * 0.5 + Math.random() * (targetY - this.plateY * 0.5) * 0.4;
            const ddx = (this.plateX + this.plateW) - spawnX;
            const ddy = targetY - spawnY;
            const len = Math.sqrt(ddx * ddx + ddy * ddy);
            const speed = 5 + Math.random() * 2;
            this.photons.push({
                x: spawnX,
                y: spawnY,
                dx: speed * ddx / len,
                dy: speed * ddy / len,
                energy: this.hc_eV_nm / this.wavelength
            });
        }
    }

    update(dtFactor: number): void {
        this.spawnPhoton();

        for (let i = this.photons.length - 1; i >= 0; i--) {
            const p = this.photons[i];
            p.x += p.dx * dtFactor;
            p.y += p.dy * dtFactor;

            if (p.x <= this.plateX + this.plateW) {
                this.photons[i] = this.photons[this.photons.length - 1];
                this.photons.pop();
                this.tryEmitElectron(p.y, p.energy);
            }
        }

        for (let i = this.electrons.length - 1; i >= 0; i--) {
            const e = this.electrons[i];
            e.x += e.dx * dtFactor;
            e.y += e.dy * dtFactor;

            if (e.y < 0 || e.y > this.height || e.x > this.width || e.x < 0) {
                this.electrons[i] = this.electrons[this.electrons.length - 1];
                this.electrons.pop();
            }
        }
    }

    tryEmitElectron(hitY: number, energy: number): void {
        if (this.electrons.length >= MAX_ELECTRONS) return;
        if (energy > this.workFunction) {
            const ke = energy - this.workFunction;
            const speed = Math.sqrt(ke) * 3;
            this.electrons.push({
                x: this.plateX + this.plateW + 2,
                y: hitY,
                dx: speed * (0.5 + Math.random() * 0.5),
                dy: -speed * Math.random() * 0.8,
                ke: ke
            });
        }
    }

    draw(): void {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#080c10';
        ctx.fillRect(0, 0, this.width, this.height);

        // Pre-rendered grid (one drawImage instead of N line draws)
        if (this.gridCanvas) ctx.drawImage(this.gridCanvas, 0, 0);

        // Vertical metal plate (cathode)
        ctx.fillStyle = '#8a8f99';
        ctx.fillRect(this.plateX, this.plateY, this.plateW, this.plateH);
        ctx.fillStyle = '#cfd3dc';
        ctx.fillRect(this.plateX, this.plateY, 2, this.plateH);

        const plateRightX = this.plateX + this.plateW;

        // Photons — single batch using current wavelength color
        if (this.photons.length > 0) {
            ctx.fillStyle = this.wavelengthToColor(this.wavelength);
            ctx.beginPath();
            for (const p of this.photons) {
                ctx.moveTo(p.x + 2.5, p.y);
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            }
            ctx.fill();
        }

        // Electrons — batch all circles into one path
        if (this.electrons.length > 0) {
            ctx.fillStyle = '#7cc4ff';
            ctx.beginPath();
            for (const e of this.electrons) {
                ctx.moveTo(e.x + 3, e.y);
                ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
            }
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Labels — Lato 600, wide tracking, dim white
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '600 9px Lato, sans-serif';
        const ctxAny = ctx as any;
        if (ctxAny.letterSpacing !== undefined) ctxAny.letterSpacing = '0.22em';

        const symbol = METAL_SYMBOLS[this.metalName] ?? this.metalName.slice(0, 2);
        ctx.textAlign = 'left';
        ctx.fillText(`CATHODE · ${symbol}`, plateRightX + 6, this.height - 10);

        ctx.textAlign = 'right';
        const freq = this.getFrequency();
        ctx.fillText(`ν = ${freq.toFixed(2)}×10¹² Hz`, this.width - 10, this.height - 10);

        if (ctxAny.letterSpacing !== undefined) ctxAny.letterSpacing = '0';
        ctx.textAlign = 'left';
    }

    loop(timestamp: number): void {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        const safeDt = Math.min(dt, 100);
        const targetFrameTime = 16.67;
        const dtFactor = safeDt / targetFrameTime;

        if (!document.hidden) {
            this.update(dtFactor);
            this.draw();
        }
        requestAnimationFrame(this.loop);
    }

    getLastKE(): number {
        return Math.max(0, this.getPhotonEnergy() - this.workFunction);
    }

    getCurrent(): number {
        return this.electrons.length * 0.1;
    }
}
