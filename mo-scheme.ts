import { MODiagram, EnergyLevel, InteractionLine } from './mo-diagram';
import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';

interface MoleculeData {
    name: string;
    description: string;
    valenceElectrons: number;
    levels: EnergyLevel[];
    interactions: InteractionLine[];
}

const molecules: Record<string, MoleculeData> = {
    'H2': {
        name: 'H₂',
        description: 'Bonding in H₂ involves the overlap of two 1s orbitals to form a σ1s bonding MO.',
        valenceElectrons: 2,
        levels: [
            { id: '1sL', label: '1s', energy: -5, type: 'atomic', side: 'left', electrons: 1 },
            { id: '1sR', label: '1s', energy: -5, type: 'atomic', side: 'right', electrons: 1 },
            { id: 'sig1s', label: 'σ1s', symmetry: '1σg', energy: -10, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig1s*', label: 'σ*1s', symmetry: '1σu', energy: 0, type: 'molecular', side: 'center', electrons: 0 }
        ],
        interactions: [
            { from: '1sL', to: 'sig1s' }, { from: '1sR', to: 'sig1s' },
            { from: '1sL', to: 'sig1s*' }, { from: '1sR', to: 'sig1s*' }
        ]
    },
    'N2': {
        name: 'N₂',
        description: 'N₂ has a triple bond. Note the σ-π crossover where π2p is lower in energy than σ2p.',
        valenceElectrons: 10,
        levels: [
            { id: '2sL', label: '2s', energy: -12, type: 'atomic', side: 'left', electrons: 2 },
            { id: '2sR', label: '2s', energy: -12, type: 'atomic', side: 'right', electrons: 2 },
            { id: '2pLx', label: '2p', energy: 0, type: 'atomic', side: 'left', electrons: 1 },
            { id: '2pLy', label: '2p', energy: 0, type: 'atomic', side: 'left', electrons: 1 },
            { id: '2pLz', label: '2p', energy: 0, type: 'atomic', side: 'left', electrons: 1 },
            { id: '2pRx', label: '2p', energy: 0, type: 'atomic', side: 'right', electrons: 1 },
            { id: '2pRy', label: '2p', energy: 0, type: 'atomic', side: 'right', electrons: 1 },
            { id: '2pRz', label: '2p', energy: 0, type: 'atomic', side: 'right', electrons: 1 },
            // MOs
            { id: 'sig2s', label: 'σ2s', symmetry: '2σg', energy: -15, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2s*', label: 'σ*2s', symmetry: '2σu', energy: -8, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2px', label: 'π2p', symmetry: '1πu', energy: 2, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2py', label: 'π2p', symmetry: '1πu', energy: 2, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2p', label: 'σ2p', symmetry: '3σg', energy: 5, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2px*', label: 'π*2p', symmetry: '1πg', energy: 12, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2py*', label: 'π*2p', symmetry: '1πg', energy: 12, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2p*', label: 'σ*2p', symmetry: '3σu', energy: 18, type: 'molecular', side: 'center', electrons: 0 }
        ],
        interactions: [
            { from: '2sL', to: 'sig2s' }, { from: '2sR', to: 'sig2s' },
            { from: '2sL', to: 'sig2s*' }, { from: '2sR', to: 'sig2s*' },
            { from: '2pLx', to: 'pi2px' }, { from: '2pRx', to: 'pi2px' },
            { from: '2pLy', to: 'pi2py' }, { from: '2pRy', to: 'pi2py' },
            { from: '2pLz', to: 'sig2p' }, { from: '2pRz', to: 'sig2p' },
            { from: '2pLx', to: 'pi2px*' }, { from: '2pRx', to: 'pi2px*' },
            { from: '2pLy', to: 'pi2py*' }, { from: '2pRy', to: 'pi2py*' },
            { from: '2pLz', to: 'sig2p*' }, { from: '2pRz', to: 'sig2p*' }
        ]
    },
    'O2': {
        name: 'O₂',
        description: 'O₂ is paramagnetic due to two unpaired electrons in the π* orbitals. Note σ2p is lower than π2p here.',
        valenceElectrons: 12,
        levels: [
            { id: '2sL', label: '2s', energy: -15, type: 'atomic', side: 'left', electrons: 2 },
            { id: '2sR', label: '2s', energy: -15, type: 'atomic', side: 'right', electrons: 2 },
            { id: '2pLx', label: '2p', energy: -2, type: 'atomic', side: 'left', electrons: 2 },
            { id: '2pLy', label: '2p', energy: -2, type: 'atomic', side: 'left', electrons: 1 },
            { id: '2pLz', label: '2p', energy: -2, type: 'atomic', side: 'left', electrons: 1 },
            { id: '2pRx', label: '2p', energy: -2, type: 'atomic', side: 'right', electrons: 2 },
            { id: '2pRy', label: '2p', energy: -2, type: 'atomic', side: 'right', electrons: 1 },
            { id: '2pRz', label: '2p', energy: -2, type: 'atomic', side: 'right', electrons: 1 },
            // MOs
            { id: 'sig2s', label: 'σ2s', symmetry: '2σg', energy: -18, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2s*', label: 'σ*2s', symmetry: '2σu', energy: -10, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2p', label: 'σ2p', symmetry: '3σg', energy: -5, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2px', label: 'π2p', symmetry: '1πu', energy: 2, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2py', label: 'π2p', symmetry: '1πu', energy: 2, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2px*', label: 'π*2p', symmetry: '1πg', energy: 10, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2py*', label: 'π*2p', symmetry: '1πg', energy: 10, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2p*', label: 'σ*2p', symmetry: '3σu', energy: 18, type: 'molecular', side: 'center', electrons: 0 }
        ],
        interactions: [
            { from: '2sL', to: 'sig2s' }, { from: '2sR', to: 'sig2s' },
            { from: '2sL', to: 'sig2s*' }, { from: '2sR', to: 'sig2s*' },
            { from: '2pLz', to: 'sig2p' }, { from: '2pRz', to: 'sig2p' },
            { from: '2pLx', to: 'pi2px' }, { from: '2pRx', to: 'pi2px' },
            { from: '2pLy', to: 'pi2py' }, { from: '2pRy', to: 'pi2py' },
            { from: '2pLx', to: 'pi2px*' }, { from: '2pRx', to: 'pi2px*' },
            { from: '2pLy', to: 'pi2py*' }, { from: '2pRy', to: 'pi2py*' },
            { from: '2pLz', to: 'sig2p*' }, { from: '2pRz', to: 'sig2p*' }
        ]
    },
    'F2': {
        name: 'F₂',
        description: 'F₂ has a single bond. All bonding and π* orbitals are filled.',
        valenceElectrons: 14,
        levels: [
            { id: '2sL', label: '2s', energy: -18, type: 'atomic', side: 'left', electrons: 2 },
            { id: '2sR', label: '2s', energy: -18, type: 'atomic', side: 'right', electrons: 2 },
            { id: '2pLx', label: '2p', energy: -5, type: 'atomic', side: 'left', electrons: 2 },
            { id: '2pLy', label: '2p', energy: -5, type: 'atomic', side: 'left', electrons: 2 },
            { id: '2pLz', label: '2p', energy: -5, type: 'atomic', side: 'left', electrons: 1 },
            { id: '2pRx', label: '2p', energy: -5, type: 'atomic', side: 'right', electrons: 2 },
            { id: '2pRy', label: '2p', energy: -5, type: 'atomic', side: 'right', electrons: 2 },
            { id: '2pRz', label: '2p', energy: -5, type: 'atomic', side: 'right', electrons: 1 },
            // MOs
            { id: 'sig2s', label: 'σ2s', symmetry: '2σg', energy: -20, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2s*', label: 'σ*2s', symmetry: '2σu', energy: -12, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2p', label: 'σ2p', symmetry: '3σg', energy: -8, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2px', label: 'π2p', symmetry: '1πu', energy: -2, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2py', label: 'π2p', symmetry: '1πu', energy: -2, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2px*', label: 'π*2p', symmetry: '1πg', energy: 8, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'pi2py*', label: 'π*2p', symmetry: '1πg', energy: 8, type: 'molecular', side: 'center', electrons: 0 },
            { id: 'sig2p*', label: 'σ*2p', symmetry: '3σu', energy: 15, type: 'molecular', side: 'center', electrons: 0 }
        ],
        interactions: [
            { from: '2sL', to: 'sig2s' }, { from: '2sR', to: 'sig2s' },
            { from: '2sL', to: 'sig2s*' }, { from: '2sR', to: 'sig2s*' },
            { from: '2pLz', to: 'sig2p' }, { from: '2pRz', to: 'sig2p' },
            { from: '2pLx', to: 'pi2px' }, { from: '2pRx', to: 'pi2px' },
            { from: '2pLy', to: 'pi2py' }, { from: '2pRy', to: 'pi2py' },
            { from: '2pLx', to: 'pi2px*' }, { from: '2pRx', to: 'pi2px*' },
            { from: '2pLy', to: 'pi2py*' }, { from: '2pRy', to: 'pi2py*' },
            { from: '2pLz', to: 'sig2p*' }, { from: '2pRz', to: 'sig2p*' }
        ]
    }
};

/**
 * Handles electron filling logic across degenerate orbitals
 */
function fillElectrons(levels: EnergyLevel[], totalElectrons: number) {
    const moLevels = levels.filter(l => l.type === 'molecular');
    moLevels.forEach(l => l.electrons = 0);

    // Group levels by energy for degeneracy
    const grouped = new Map<number, EnergyLevel[]>();
    moLevels.forEach(l => {
        const group = grouped.get(l.energy) || [];
        group.push(l);
        grouped.set(l.energy, group);
    });

    // Sort groups by energy
    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);

    let remaining = totalElectrons;
    for (const [_, group] of sortedGroups) {
        const groupSize = group.length;
        const maxCapacity = groupSize * 2;

        if (remaining <= 0) break;

        if (remaining >= maxCapacity) {
            group.forEach(l => l.electrons = 2);
            remaining -= maxCapacity;
        } else {
            // Hund's rule
            if (remaining <= groupSize) {
                for (let i = 0; i < remaining; i++) group[i].electrons = 1;
                remaining = 0;
            } else {
                group.forEach(l => l.electrons = 1);
                remaining -= groupSize;
                for (let i = 0; i < remaining; i++) group[i].electrons = 2;
                remaining = 0;
            }
        }
    }
}

// UI Elements
const canvas = document.getElementById('mo-canvas') as HTMLCanvasElement;
let currentMolKey = 'O2';
const bondOrderVal = document.getElementById('bond-order')!;
const magnetismVal = document.getElementById('magnetism')!;
const homoVal = document.getElementById('homo-label')!;
const lumoVal = document.getElementById('lumo-label')!;
const theoryNote = document.getElementById('theory-note')!;

const diagram = new MODiagram(canvas);

function updateMO() {
    const molKey = currentMolKey;
    const mol = molecules[molKey];
    if (!mol) return;

    // Fill molecular orbitals
    const moLevels = mol.levels.filter(l => l.type === 'molecular');
    fillElectrons(mol.levels, mol.valenceElectrons);

    // Calculate stats
    const bonding = moLevels.filter(l => !l.label.includes('*')).reduce((acc, curr) => acc + curr.electrons, 0);
    const antibonding = moLevels.filter(l => l.label.includes('*')).reduce((acc, curr) => acc + curr.electrons, 0);
    const bondOrder = (bonding - antibonding) / 2;
    const isParamagnetic = moLevels.some(l => l.electrons === 1);

    const filledLevels = moLevels.filter(l => l.electrons > 0).sort((a, b) => b.energy - a.energy);
    const unfilledLevels = moLevels.filter(l => l.electrons < 2).sort((a, b) => a.energy - b.energy);

    const homo = filledLevels[0]?.label || 'None';
    const lumo = unfilledLevels[0]?.label || 'None';

    // Update UI
    bondOrderVal.textContent = bondOrder.toFixed(1);
    magnetismVal.textContent = isParamagnetic ? 'Paramagnetic' : 'Diamagnetic';
    homoVal.textContent = homo;
    lumoVal.textContent = lumo;
    theoryNote.textContent = mol.description;

    diagram.setLevels(mol.levels, mol.interactions);
}

document.querySelectorAll<HTMLButtonElement>('.mol-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.mol-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        currentMolKey = chip.dataset.mol!;
        updateMO();
    });
});
updateMO();
