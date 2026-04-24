/**
 * Molecular Orbital Diagram Rendering Module
 * Handles the logic and drawing of energy level diagrams for diatomic molecules.
 */

export interface EnergyLevel {
    id: string;
    label: string;
    energy: number; // Normalized energy, usually 0 to 1 or arbitrary units
    type: 'atomic' | 'molecular';
    side?: 'left' | 'right' | 'center';
    electrons: number; // 0, 1, or 2
    symmetry?: string; // e.g., '1σg', '1σu*', etc.
}

export interface InteractionLine {
    from: string;
    to: string;
}

export class MODiagram {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private levels: EnergyLevel[] = [];
    private interactions: InteractionLine[] = [];
    private padding = 60;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    public setLevels(levels: EnergyLevel[], interactions: InteractionLine[]) {
        this.levels = levels;
        this.interactions = interactions;
        this.draw();
    }

    private resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.draw();
    }

    private getY(energy: number): number {
        // Map energy (usually -10 to 10 or similar) to canvas Y
        // For diatomic MOs, we'll assume a range
        const minE = -20;
        const maxE = 20;
        const height = this.canvas.height / (window.devicePixelRatio || 1) - this.padding * 2;
        const normalized = (energy - minE) / (maxE - minE);
        return this.padding + height * (1 - normalized);
    }

    private getX(side: 'left' | 'right' | 'center'): number {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        if (side === 'left') return width * 0.2;
        if (side === 'right') return width * 0.8;
        return width * 0.5;
    }

    public draw() {
        const ctx = this.ctx;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, width, height);

        // Draw Energy Axis
        this.drawAxis();

        // Draw Interactions (Dashed lines)
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;

        // Group levels by energy and side to handle degenerate offsets in drawing
        const levelOffsets = new Map<string, number>();
        const energyGroups = new Map<string, EnergyLevel[]>();

        for (const level of this.levels) {
            const key = `${level.energy}_${level.side || 'center'}`;
            const group = energyGroups.get(key) || [];
            group.push(level);
            energyGroups.set(key, group);
        }

        for (const [_, group] of energyGroups) {
            group.forEach((level, index) => {
                const offset = (index - (group.length - 1) / 2) * 20; // 20px spacing
                levelOffsets.set(level.id, offset);
            });
        }

        for (const line of this.interactions) {
            const from = this.levels.find(l => l.id === line.from);
            const to = this.levels.find(l => l.id === line.to);
            if (from && to) {
                const fromX = this.getX(from.side || 'center') + (levelOffsets.get(from.id) || 0);
                const fromY = this.getY(from.energy);
                const toX = this.getX(to.side || 'center') + (levelOffsets.get(to.id) || 0);
                const toY = this.getY(to.energy);

                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // Draw Levels
        for (const level of this.levels) {
            const offset = levelOffsets.get(level.id) || 0;
            this.drawLevel(level, offset);
        }
    }

    private drawAxis() {
        const ctx = this.ctx;
        const x = 30;
        const yStart = this.padding;
        const yEnd = (this.canvas.height / (window.devicePixelRatio || 1)) - this.padding;

        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, yEnd);
        ctx.lineTo(x, yStart);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x - 5, yStart + 10);
        ctx.lineTo(x, yStart);
        ctx.lineTo(x + 5, yStart + 10);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Inter, sans-serif';
        ctx.save();
        ctx.translate(x - 10, yStart + 50);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Energy', 0, 0);
        ctx.restore();
    }

    private drawLevel(level: EnergyLevel, offset: number) {
        const ctx = this.ctx;
        const x = this.getX(level.side || 'center') + offset;
        const y = this.getY(level.energy);
        const barWidth = level.type === 'molecular' ? 60 : 40;

        // Draw the energy bar
        ctx.strokeStyle = level.type === 'molecular' ? '#6699ff' : '#aaa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - barWidth / 2, y);
        ctx.lineTo(x + barWidth / 2, y);
        ctx.stroke();

        // Draw Labels
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(level.label, x, y - 10);

        if (level.symmetry) {
            ctx.font = 'italic 10px Inter, sans-serif';
            ctx.fillText(level.symmetry, x, y + 20);
        }

        // Draw Electrons
        this.drawElectrons(x, y, level.electrons);
    }

    private drawElectrons(x: number, y: number, count: number) {
        const ctx = this.ctx;
        const spacing = 8;

        ctx.lineWidth = 2;
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1a1520';

        if (count >= 1) {
            // Spin up
            const xPos = count === 2 ? x - spacing : x;
            this.drawElectronArrow(ctx, xPos, y, true);
        }
        if (count === 2) {
            // Spin down
            this.drawElectronArrow(ctx, x + spacing, y, false);
        }
    }

    private drawElectronArrow(ctx: CanvasRenderingContext2D, x: number, y: number, up: boolean) {
        const len = 15;
        const head = 5;

        ctx.beginPath();
        if (up) {
            ctx.moveTo(x, y + len / 2);
            ctx.lineTo(x, y - len / 2);
            // Half arrowhead
            ctx.moveTo(x, y - len / 2);
            ctx.lineTo(x - head, y - len / 2 + head);
        } else {
            ctx.moveTo(x, y - len / 2);
            ctx.lineTo(x, y + len / 2);
            // Half arrowhead
            ctx.moveTo(x, y + len / 2);
            ctx.lineTo(x + head, y + len / 2 - head);
        }
        ctx.stroke();
    }
}
