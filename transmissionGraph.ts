// Draws a T(E) curve for fixed V₀ and a, with current E marked
export class TransmissionGraph {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    currentE: number = 3.0;
    currentV0: number = 5.0;
    currentA: number = 0.5;

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

    getT(E: number, V0: number, a: number): number {
        if (E <= 0.01) return 0;
        if (Math.abs(E - V0) < 0.01) {
            // E ≈ V₀: T = 1 / (1 + m*a²*V₀/(2ℏ²)); with √(2m)/ℏ = 5.12 this is (5.12·a)²·V₀/4
            const factor = (5.12 * a) * (5.12 * a) * V0 / 4;
            return 1.0 / (1.0 + factor);
        }
        if (E < V0) {
            const kappa_a = Math.sqrt(V0 - E) * a * 5.12;
            const sinh_ka = Math.sinh(kappa_a);
            return 1.0 / (1 + (V0 * V0 * sinh_ka * sinh_ka) / (4 * E * (V0 - E)));
        } else {
            const k2_a = Math.sqrt(E - V0) * a * 5.12;
            const sin_k2a = Math.sin(k2_a);
            return 1.0 / (1 + (V0 * V0 * sin_k2a * sin_k2a) / (4 * E * (E - V0)));
        }
    }

    update(E: number, V0: number, a: number) {
        this.currentE = E;
        this.currentV0 = V0;
        this.currentA = a;
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const padding = { left: 45, right: 20, top: 20, bottom: 35 };
        const plotW = this.width - padding.left - padding.right;
        const plotH = this.height - padding.top - padding.bottom;

        const maxE = 10;

        // Axes
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + plotH);
        ctx.lineTo(padding.left + plotW, padding.top + plotH);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#636e72';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('E (eV)', padding.left + plotW / 2, this.height - 5);
        ctx.save();
        ctx.translate(12, padding.top + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('T', 0, 0);
        ctx.restore();

        // Y ticks (0, 0.5, 1)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        [0, 0.5, 1].forEach(t => {
            const y = padding.top + plotH * (1 - t);
            ctx.fillStyle = '#999';
            ctx.fillText(t.toFixed(1), padding.left - 5, y);
            ctx.beginPath();
            ctx.strokeStyle = '#eee';
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + plotW, y);
            ctx.stroke();
        });

        // X ticks
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let e = 0; e <= maxE; e += 2) {
            const x = padding.left + (e / maxE) * plotW;
            ctx.fillStyle = '#999';
            ctx.fillText(`${e}`, x, padding.top + plotH + 5);
        }

        // V₀ marker
        const v0x = padding.left + (this.currentV0 / maxE) * plotW;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 87, 34, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.moveTo(v0x, padding.top);
        ctx.lineTo(v0x, padding.top + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff5722';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('V₀', v0x, padding.top - 5);

        // T(E) curve
        ctx.beginPath();
        ctx.strokeStyle = '#3d5afe';
        ctx.lineWidth = 2;

        const numPoints = 400;
        for (let i = 0; i <= numPoints; i++) {
            const e = (i / numPoints) * maxE;
            if (e < 0.05) continue;
            const t = this.getT(e, this.currentV0, this.currentA);
            const x = padding.left + (e / maxE) * plotW;
            const y = padding.top + plotH * (1 - t);

            if (i <= 1 || e < 0.1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Current E marker
        const currentT = this.getT(this.currentE, this.currentV0, this.currentA);
        const markerX = padding.left + (this.currentE / maxE) * plotW;
        const markerY = padding.top + plotH * (1 - currentT);

        ctx.beginPath();
        ctx.fillStyle = '#3d5afe';
        ctx.shadowColor = 'rgba(61, 90, 254, 0.5)';
        ctx.shadowBlur = 8;
        ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#3d5afe';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`T = ${currentT.toFixed(3)}`, markerX + 10, markerY - 5);
    }
}
