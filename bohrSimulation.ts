export class BohrSimulation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    // State
    n: number = 3; // Start at n=3
    targetN: number | null = null;
    transitionProgress: number = 0;
    waitingForAbsorption: boolean = false; // New state for absorption

    electronAngle: number = 0;
    electronSpeed: number = 0.035; // Halfway speed

    // Photons: { x, y, vx, vy, color, life, totalLife, waviness, type: 'emission'|'absorption' }
    photons: any[] = [];

    // Constants
    baseRadiusScale: number = 30;

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
            this.baseRadiusScale = Math.min(this.width, this.height) / 20;
        }
    }

    getRadius(n: number): number {
        // Quantized radius r_n = n^2 * r1
        // Scaling to fit screen: r = scale * n^1.2 (for visualization, n^2 grows too fast)
        return this.baseRadiusScale * (n * 1.5);
    }

    transitionTo(finalN: number) {
        if (this.targetN !== null || this.waitingForAbsorption) return; // Busy
        if (finalN === this.n) return;

        this.targetN = finalN;

        // Emission (High -> Low): Electron jumps immediately, photon emitted during/after? 
        // Typically emission is instantaneous with jump.
        if (finalN < this.n) {
            this.emitPhoton(this.n, finalN);
            this.transitionProgress = 0;
        }

        // Absorption (Low -> High): Photon comes in FIRST, then electron jumps.
        if (finalN > this.n) {
            this.absorbPhoton(this.n, finalN);
            this.waitingForAbsorption = true; // Wait for photon to hit
            this.transitionProgress = 0;
        }
    }

    getPhotonColor(ni: number, nf: number): string {
        const lower = Math.min(ni, nf);
        const upper = Math.max(ni, nf);

        if (lower === 1) return '#AA00FF'; // Lyman (UV)
        if (lower === 2) {
            // Balmer
            if (upper === 3) return '#F44336'; // Red
            if (upper === 4) return '#03A9F4'; // Cyan
            if (upper === 5) return '#3F51B5'; // Blue
            return '#673AB7'; // Violet
        }
        if (lower === 3) return '#D32F2F'; // Paschen (IR)
        return '#FFFFFF'; // Unknown/Other
    }

    absorbPhoton(ni: number, nf: number) {
        const color = this.getPhotonColor(ni, nf);
        const r = this.getRadius(ni); // Target radius (current orbit)

        // Calculate time to impact
        // Photon speed = 3.5
        // Distance from spawn to target
        const spawnDist = Math.max(this.width, this.height) / 1.5;
        const speed = 3.5;

        // Time to travel from spawnDist to r
        // dist = spawnDist - r
        const distToTravel = spawnDist - r;
        const framesToImpact = distToTravel / speed;

        // Where will the electron be in framesToImpact?
        // angular velocity = 0.035 / n
        const angularVelocity = 0.035 / ni;
        // Electron moves counter-clockwise (positive angle)
        const futureAngle = this.electronAngle + angularVelocity * framesToImpact;

        // Spawn point is at futureAngle, distance spawnDist
        // We want it to come from OUTSIDE, so same angle as target but further out.
        const sx = this.width / 2 + Math.cos(futureAngle) * spawnDist;
        const sy = this.height / 2 + Math.sin(futureAngle) * spawnDist;

        // Target point is at futureAngle, distance r (electron position at impact)
        const tx = this.width / 2 + Math.cos(futureAngle) * r;
        const ty = this.height / 2 + Math.sin(futureAngle) * r;

        // Velocity vector pointing to target (inward)
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.photons.push({
            x: sx,
            y: sy,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            color: color,
            life: 1000,
            totalLife: 1000,
            waviness: 0,
            type: 'absorption'
        });
    }

    emitPhoton(ni: number, nf: number) {
        const color = this.getPhotonColor(ni, nf);

        // Spawn at electron position
        const radius = this.getRadius(this.n);
        const ex = this.width / 2 + Math.cos(this.electronAngle) * radius;
        const ey = this.height / 2 + Math.sin(this.electronAngle) * radius;

        // Shoot outwards from center
        const angle = Math.atan2(ey - this.height / 2, ex - this.width / 2);
        const speed = 3.5; // Halfway speed

        this.photons.push({
            x: ex,
            y: ey,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            life: 200,
            totalLife: 200,
            waviness: 0,
            type: 'emission'
        });
    }

    update() {
        // Orbit
        let currentEffectiveN = this.n;

        // If waiting for absorption, we don't transition n yet.
        if (this.targetN !== null && !this.waitingForAbsorption) {
            this.transitionProgress += 0.015; // Halfway speed

            // Lerp N for drawing radius
            const t = this.easeInOutQuad(this.transitionProgress);
            currentEffectiveN = this.n + (this.targetN - this.n) * t;

            if (this.transitionProgress >= 1) {
                this.n = this.targetN;
                this.targetN = null;
                this.transitionProgress = 0;
            }
        }

        this.electronAngle += 0.035 / currentEffectiveN; // Halfway speed

        // Photons
        for (let i = this.photons.length - 1; i >= 0; i--) {
            const p = this.photons[i];
            p.x += p.vx;
            p.y += p.vy;
            p.waviness += 0.35; // Slightly faster waviness too

            if (p.type === 'emission') {
                p.life--;
                if (p.life <= 0) this.photons.splice(i, 1);
            } else if (p.type === 'absorption') {
                // Check collision with center/orbit
                const dx = p.x - this.width / 2;
                const dy = p.y - this.height / 2;
                const d = Math.sqrt(dx * dx + dy * dy);
                const r = this.getRadius(this.n);

                // If photon reaches the orbit radius
                if (d <= r) {
                    // Trigger jump!
                    this.waitingForAbsorption = false;
                    this.photons.splice(i, 1);
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const cx = this.width / 2;
        const cy = this.height / 2;

        // Draw Orbits
        for (let i = 1; i <= 6; i++) {
            const r = this.getRadius(i);
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            if (i === this.targetN || i === this.n) this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';

            // Handle if we are waiting for absorption (highlight target)
            if (this.waitingForAbsorption && i === this.targetN) this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';

            this.ctx.lineWidth = 1;
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.stroke();

            // Label
            this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
            this.ctx.font = '600 10px Lato, sans-serif';
            this.ctx.fillText(`n=${i}`, cx + 5, cy - r);
        }

        // Draw Nucleus
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ff1744';
        this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowColor = '#ff1744';
        this.ctx.shadowBlur = 10;


        // Draw Electron
        // Radius depends on transition state
        let r = this.getRadius(this.n);
        if (this.targetN !== null && !this.waitingForAbsorption) {
            const t = this.easeInOutQuad(this.transitionProgress);
            const r1 = this.getRadius(this.n);
            const r2 = this.getRadius(this.targetN);
            r = r1 + (r2 - r1) * t;
        }

        const ex = cx + Math.cos(this.electronAngle) * r;
        const ey = cy + Math.sin(this.electronAngle) * r;

        this.ctx.beginPath();
        this.ctx.fillStyle = '#7cc4ff';
        this.ctx.shadowColor = '#7cc4ff';
        this.ctx.shadowBlur = 15;
        this.ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw Photons (Sine wave packet)
        this.photons.forEach(p => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.lineCap = 'round';

            // Draw a sine wave segment oriented along velocity
            const angle = Math.atan2(p.vy, p.vx);
            const packetLen = 40; // Longer packet
            const freq = 0.4;
            const amp = 6;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(angle);

            this.ctx.moveTo(-packetLen / 2, 0);
            for (let x = -packetLen / 2; x <= packetLen / 2; x += 2) {
                // Wave travels backwards along packet as p moves? Or stationary wave packet?
                // Let's make it wiggle.
                const phase = p.waviness;
                // Envelope window (taper ends)
                const distFromCenter = Math.abs(x);
                const envelope = Math.max(0, 1 - distFromCenter / (packetLen / 2));

                const y = Math.sin(x * freq - phase) * amp * envelope;
                this.ctx.lineTo(x, y);
            }

            this.ctx.stroke();
            this.ctx.restore();
            this.ctx.shadowBlur = 0;
        });
    }

    loop() {
        if (!document.hidden) {
            this.update();
            this.draw();
        }
        requestAnimationFrame(this.loop);
    }

    easeInOutQuad(t: number): number {
        return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}
