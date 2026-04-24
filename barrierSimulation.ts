export class BarrierSimulation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    // Physics parameters
    energy: number = 3.0;       // eV (particle energy)
    barrierHeight: number = 5.0; // eV (V₀)
    barrierWidth: number = 0.5;  // nm (a)

    // Animation
    time: number = 0;
    lastTimestamp: number = 0;

    // Layout coordinates
    regionLeft: number = 0;
    regionRight: number = 0;
    barrierLeft: number = 0;
    barrierRight: number = 0;
    baseline: number = 0;

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
        const padding = 50;
        this.regionLeft = padding;
        this.regionRight = this.width - padding;
        const totalW = this.regionRight - this.regionLeft;
        // Barrier centered, width proportional to parameter
        const barrierFrac = Math.max(0.05, Math.min(0.3, this.barrierWidth / 3.0));
        this.barrierLeft = this.regionLeft + totalW * (0.5 - barrierFrac / 2);
        this.barrierRight = this.regionLeft + totalW * (0.5 + barrierFrac / 2);
        this.baseline = this.height * 0.65;
    }

    // Transmission coefficient
    getTransmission(): number {
        const E = this.energy;
        const V0 = this.barrierHeight;
        const a = this.barrierWidth;

        if (Math.abs(E - V0) < 0.01) {
            // E ≈ V₀: T = 1 / (1 + m*a²*V₀/(2ℏ²))
            // Simplified: use limit formula
            const factor = (a * V0) * (a * V0) * 0.26; // approximate scaling
            return 1.0 / (1.0 + factor);
        }

        if (E < V0) {
            // Tunneling: T = [1 + V₀²sinh²(κa) / (4E(V₀-E))]⁻¹
            // κ = sqrt(2m(V₀-E))/ℏ → use dimensionless κa with scaling
            const kappa_a = Math.sqrt(V0 - E) * a * 5.12; // 5.12 ≈ sqrt(2m)/ℏ in eV-nm units
            const sinh_ka = Math.sinh(kappa_a);
            const denom = 1 + (V0 * V0 * sinh_ka * sinh_ka) / (4 * E * (V0 - E));
            return 1.0 / denom;
        } else {
            // E > V₀: oscillatory transmission
            // T = [1 + V₀²sin²(k₂a) / (4E(E-V₀))]⁻¹
            const k2_a = Math.sqrt(E - V0) * a * 5.12;
            const sin_k2a = Math.sin(k2_a);
            const denom = 1 + (V0 * V0 * sin_k2a * sin_k2a) / (4 * E * (E - V0));
            return 1.0 / denom;
        }
    }

    getReflection(): number {
        return 1.0 - this.getTransmission();
    }

    update(dt: number) {
        this.time += dt * 0.004;
        this.updateLayout();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const ctx = this.ctx;

        const T = this.getTransmission();
        const R = this.getReflection();

        // Draw potential energy landscape
        this.drawPotential(ctx);

        // Draw waves
        this.drawWaves(ctx, T, R);

        // Draw labels
        this.drawLabels(ctx, T, R);
    }

    drawPotential(ctx: CanvasRenderingContext2D) {
        // V=0 baseline
        ctx.beginPath();
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(this.regionLeft, this.baseline);
        ctx.lineTo(this.regionRight, this.baseline);
        ctx.stroke();
        ctx.setLineDash([]);

        // Barrier rectangle
        const maxBarrierVisualHeight = this.height * 0.45;
        const barrierVisualH = maxBarrierVisualHeight * Math.min(1, this.barrierHeight / 10);
        const barrierTop = this.baseline - barrierVisualH;

        // Barrier fill with gradient
        const grad = ctx.createLinearGradient(0, barrierTop, 0, this.baseline);
        grad.addColorStop(0, 'rgba(255, 87, 34, 0.35)');
        grad.addColorStop(1, 'rgba(255, 87, 34, 0.08)');
        ctx.fillStyle = grad;
        ctx.fillRect(this.barrierLeft, barrierTop, this.barrierRight - this.barrierLeft, barrierVisualH);

        // Barrier outline
        ctx.beginPath();
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2;
        ctx.moveTo(this.barrierLeft, this.baseline);
        ctx.lineTo(this.barrierLeft, barrierTop);
        ctx.lineTo(this.barrierRight, barrierTop);
        ctx.lineTo(this.barrierRight, this.baseline);
        ctx.stroke();

        // V₀ label
        ctx.fillStyle = '#e64a19';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`V₀ = ${this.barrierHeight.toFixed(1)} eV`,
            (this.barrierLeft + this.barrierRight) / 2, barrierTop - 8);

        // Energy level line across full width
        const energyFrac = Math.min(1, this.energy / 10);
        const energyY = this.baseline - energyFrac * maxBarrierVisualHeight;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(61, 90, 254, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.moveTo(this.regionLeft, energyY);
        ctx.lineTo(this.regionRight, energyY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#3d5afe';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`E = ${this.energy.toFixed(1)} eV`, this.regionLeft + 5, energyY - 8);

        // Region labels
        ctx.fillStyle = '#636e72';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Region I', (this.regionLeft + this.barrierLeft) / 2, this.baseline + 25);
        ctx.fillText('Region II', (this.barrierLeft + this.barrierRight) / 2, this.baseline + 25);
        ctx.fillText('Region III', (this.barrierRight + this.regionRight) / 2, this.baseline + 25);
    }

    drawWaves(ctx: CanvasRenderingContext2D, T: number, R: number) {
        const waveAmplitude = 40;
        const k1 = Math.sqrt(this.energy) * 3; // wave number (visual)
        const omega = this.energy * 2; // angular frequency (visual)

        // === Region I: Incident + Reflected wave ===
        const incidentAmp = 1.0;
        const reflectedAmp = Math.sqrt(R);
        const transmittedAmp = Math.sqrt(T);

        ctx.lineWidth = 2.5;

        // Incident wave (traveling right) — cyan
        ctx.beginPath();
        ctx.strokeStyle = '#00bcd4';
        ctx.shadowColor = 'rgba(0, 188, 212, 0.4)';
        ctx.shadowBlur = 6;

        const regionIWidth = this.barrierLeft - this.regionLeft;
        for (let px = 0; px <= regionIWidth; px += 1.5) {
            const x = this.regionLeft + px;
            const xNorm = px / regionIWidth * 8; // normalized position for wave calc
            const val = incidentAmp * Math.sin(k1 * xNorm - omega * this.time);
            const y = this.baseline - val * waveAmplitude;

            if (px === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Reflected wave (traveling left) — red-orange
        if (R > 0.01) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(244, 67, 54, 0.8)';
            ctx.shadowColor = 'rgba(244, 67, 54, 0.3)';
            ctx.shadowBlur = 6;

            for (let px = 0; px <= regionIWidth; px += 1.5) {
                const x = this.regionLeft + px;
                const xNorm = px / regionIWidth * 8;
                const val = reflectedAmp * Math.sin(-k1 * xNorm - omega * this.time);
                const y = this.baseline - val * waveAmplitude;

                if (px === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // === Region II: Inside barrier ===
        const barrierW = this.barrierRight - this.barrierLeft;
        if (this.energy < this.barrierHeight) {
            // Exponentially decaying (evanescent wave)
            const kappa = Math.sqrt(this.barrierHeight - this.energy) * 2;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 152, 0, 0.7)';
            ctx.shadowColor = 'rgba(255, 152, 0, 0.3)';
            ctx.shadowBlur = 4;

            for (let px = 0; px <= barrierW; px += 1.5) {
                const x = this.barrierLeft + px;
                const frac = px / barrierW;
                const decay = Math.exp(-kappa * frac * 3);
                const val = decay * Math.sin(-omega * this.time);
                const y = this.baseline - val * waveAmplitude;

                if (px === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // Oscillatory inside barrier (E > V₀)
            const k2 = Math.sqrt(this.energy - this.barrierHeight) * 3;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 152, 0, 0.7)';
            ctx.shadowColor = 'rgba(255, 152, 0, 0.3)';
            ctx.shadowBlur = 4;

            for (let px = 0; px <= barrierW; px += 1.5) {
                const x = this.barrierLeft + px;
                const xNorm = px / barrierW * 4;
                const val = Math.sin(k2 * xNorm - omega * this.time);
                const y = this.baseline - val * waveAmplitude;

                if (px === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // === Region III: Transmitted wave (traveling right) — green ===
        if (T > 0.001) {
            ctx.beginPath();
            ctx.strokeStyle = '#4caf50';
            ctx.shadowColor = 'rgba(76, 175, 80, 0.4)';
            ctx.shadowBlur = 6;

            const regionIIIWidth = this.regionRight - this.barrierRight;
            for (let px = 0; px <= regionIIIWidth; px += 1.5) {
                const x = this.barrierRight + px;
                const xNorm = px / regionIIIWidth * 8;
                const val = transmittedAmp * Math.sin(k1 * xNorm - omega * this.time);
                const y = this.baseline - val * waveAmplitude;

                if (px === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Wave legend
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        const legendY = this.height - 30;

        ctx.fillStyle = '#00bcd4';
        ctx.fillRect(this.regionLeft, legendY, 14, 3);
        ctx.fillText('Incident', this.regionLeft + 18, legendY + 4);

        ctx.fillStyle = '#f44336';
        ctx.fillRect(this.regionLeft + 90, legendY, 14, 3);
        ctx.fillText('Reflected', this.regionLeft + 108, legendY + 4);

        ctx.fillStyle = '#4caf50';
        ctx.fillRect(this.regionLeft + 190, legendY, 14, 3);
        ctx.fillText('Transmitted', this.regionLeft + 208, legendY + 4);

        ctx.fillStyle = '#ff9800';
        ctx.fillRect(this.regionLeft + 310, legendY, 14, 3);
        ctx.fillText('Inside Barrier', this.regionLeft + 328, legendY + 4);
    }

    drawLabels(ctx: CanvasRenderingContext2D, T: number, R: number) {
        // Title indicator
        const isTunneling = this.energy < this.barrierHeight;
        ctx.fillStyle = isTunneling ? '#ff5722' : '#4caf50';
        ctx.font = 'bold 14px Merriweather';
        ctx.textAlign = 'center';
        ctx.fillText(
            isTunneling ? '⚡ Quantum Tunneling (E < V₀)' : '✓ Classical Transmission (E > V₀)',
            this.width / 2, 25
        );

        // T and R values in top corners
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#4caf50';
        ctx.fillText(`T = ${T.toFixed(4)}`, this.regionLeft, 50);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f44336';
        ctx.fillText(`R = ${R.toFixed(4)}`, this.regionRight, 50);
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
