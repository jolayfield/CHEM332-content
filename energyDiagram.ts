export class EnergyDiagram {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    currentN: number = 3;
    targetN: number | null = null;

    levels: number[] = [1, 2, 3, 4, 5, 6];

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

    /**
     * Visually-spaced Y positions.
     * The axis is linear in log|E| (|E_n| ∝ 1/n², so y ∝ ln n), NOT linear
     * in E: on a linear axis n = 4, 5, 6 would sit only a few px apart and
     * be unreadable. The compression is disclosed on the canvas.
     * n = ∞ (E = 0) cannot sit on a log axis, so it is drawn as a separate
     * dashed line a fixed gap above the highest level (axis break).
     */
    getY(n: number): number {
        const paddingTop = 35;
        const paddingBot = 35;
        const infGap = 20; // gap between n = ∞ and the highest drawn level
        if (!isFinite(n)) return paddingTop;

        const nMax = Math.max(...this.levels);
        const bottom = this.height - paddingBot;          // n = 1
        const top = paddingTop + infGap;                  // n = nMax
        const frac = Math.log(n) / Math.log(nMax);        // 0 (n=1) … 1 (n=nMax)
        return bottom - frac * (bottom - top);
    }

    updateState(n: number, target: number | null) {
        this.currentN = n;
        this.targetN = target;
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const ctx = this.ctx;

        const paddingLeft = 55;
        const lineW = this.width - paddingLeft - 64; // leave room for eV labels on the right

        // ── Ionization limit n = ∞ (E = 0) ──
        const yInf = this.getY(Infinity);
        ctx.beginPath();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(paddingLeft, yInf);
        ctx.lineTo(paddingLeft + lineW, yInf);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#666';
        ctx.font = '12px Lato, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('n=∞', paddingLeft - 8, yInf);
        ctx.textAlign = 'left';
        ctx.fillText('0 eV', paddingLeft + lineW + 8, yInf);
        ctx.font = 'italic 10px Lato, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText('ionization', paddingLeft + 4, yInf - 2);

        // ── Draw each energy level ──
        this.levels.forEach(n => {
            const y = this.getY(n);
            const isActive = n === this.currentN;
            const isTarget = n === (this.targetN ?? -1);

            // Level line
            ctx.beginPath();
            ctx.strokeStyle = (isActive || isTarget) ? '#340E51' : '#bbb';
            ctx.lineWidth = (isActive || isTarget) ? 2.5 : 1.2;
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(paddingLeft + lineW, y);
            ctx.stroke();

            // n label (left)
            ctx.fillStyle = (isActive || isTarget) ? '#340E51' : '#666';
            ctx.font = (isActive || isTarget) ? 'bold 13px Lato, sans-serif' : '12px Lato, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`n=${n}`, paddingLeft - 8, y);

            // Energy label (right)
            const ev = -13.6 / (n * n);
            ctx.textAlign = 'left';
            ctx.fillText(`${ev.toFixed(1)} eV`, paddingLeft + lineW + 8, y);
        });

        // ── Electron marker on current level ──
        const yC = this.getY(this.currentN);
        ctx.beginPath();
        ctx.fillStyle = '#2196F3';
        ctx.arc(paddingLeft + lineW / 2, yC, 7, 0, Math.PI * 2);
        ctx.fill();
        // Glow ring
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(33,150,243,0.35)';
        ctx.lineWidth = 3;
        ctx.arc(paddingLeft + lineW / 2, yC, 11, 0, Math.PI * 2);
        ctx.stroke();

        // ── Transition arrow ──
        if (this.targetN !== null) {
            const y1 = this.getY(this.currentN);
            const y2 = this.getY(this.targetN);
            const arrowX = paddingLeft + lineW / 2 + 25;
            const isEmission = this.targetN < this.currentN;
            const color = isEmission ? '#E53935' : '#43A047';

            // Arrow line
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.moveTo(arrowX, y1);
            ctx.lineTo(arrowX, y2);
            ctx.stroke();

            // Arrowhead
            const headLen = 8;
            const dir = y2 > y1 ? 1 : -1;
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.moveTo(arrowX, y2);
            ctx.lineTo(arrowX - headLen * 0.6, y2 - dir * headLen);
            ctx.lineTo(arrowX + headLen * 0.6, y2 - dir * headLen);
            ctx.closePath();
            ctx.fill();

            // Label: ΔE
            const deltaE = Math.abs(-13.6 / (this.targetN * this.targetN) - (-13.6 / (this.currentN * this.currentN)));
            ctx.fillStyle = color;
            ctx.font = 'bold 11px Lato, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${deltaE.toFixed(2)} eV`, arrowX + 8, (y1 + y2) / 2);
        }

        // ── Title ──
        ctx.fillStyle = '#636e72';
        ctx.font = '11px Lato, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('E = −13.6 / n²  eV', this.width / 2, 5);

        // ── Scale disclosure ──
        ctx.font = 'italic 10px Lato, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText('energy axis compressed (log |E| scale) — not linear in E', this.width / 2, this.height - 2);
    }
}

