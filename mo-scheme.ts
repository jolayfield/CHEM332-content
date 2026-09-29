import { MODiagram, EnergyLevel, InteractionLine } from './mo-diagram';
import './style.css';

interface MoleculeData {
    name: string;
    description: string;
    valenceElectrons: number;
    levels: EnergyLevel[];
    interactions: InteractionLine[];
}

type Character = 'bonding' | 'antibonding' | 'nonbonding';

function mo(id: string, label: string, energy: number, character: Character, symmetry?: string): EnergyLevel {
    return { id, label, symmetry, energy, character, type: 'molecular', side: 'center', electrons: 0 };
}

function ao(id: string, label: string, energy: number, side: 'left' | 'right', electrons: number): EnergyLevel {
    return { id, label, energy, type: 'atomic', side, electrons };
}

/** Distribute p electrons over px, py, pz following Hund's rule. */
function pOccupancy(n: number): [number, number, number] {
    const occ: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < n; i++) occ[i % 3]++;
    return occ;
}

/** H₂ and He₂: two 1s orbitals → 1σg and 1σu*. */
function makeFirstRow(name: string, electronsPerAtom: number, description: string): MoleculeData {
    return {
        name,
        description,
        valenceElectrons: 2 * electronsPerAtom,
        levels: [
            ao('1sL', '1s', -5, 'left', electronsPerAtom),
            ao('1sR', '1s', -5, 'right', electronsPerAtom),
            mo('sig1s', 'σ1s', -10, 'bonding', '1σg'),
            mo('sig1s*', 'σ*1s', 0, 'antibonding', '1σu'),
        ],
        interactions: [
            { from: '1sL', to: 'sig1s' }, { from: '1sR', to: 'sig1s' },
            { from: '1sL', to: 'sig1s*' }, { from: '1sR', to: 'sig1s*' },
        ],
    };
}

/**
 * Second-row homonuclear diatomics (schematic energies, 2p AO at 0).
 * The 2s–2p gap grows across the period. While it is small (Li–N), 2s/2p mixing
 * pushes 3σg above 1πu; from O onward the unmixed order (3σg below 1πu) applies.
 */
function makeSecondRow(
    name: string, valencePerAtom: number, gap2s2p: number, spMixed: boolean, description: string,
): MoleculeData {
    const s2 = Math.min(2, valencePerAtom);
    const [px, py, pz] = pOccupancy(valencePerAtom - s2);
    const e2s = -gap2s2p;
    const ds = 0.2 * gap2s2p;
    const sigma2p = spMixed ? -1 : -3.5;
    const pi2p = -2;
    return {
        name,
        description,
        valenceElectrons: 2 * valencePerAtom,
        levels: [
            ao('2sL', '2s', e2s, 'left', s2), ao('2sR', '2s', e2s, 'right', s2),
            ao('2pLx', '2p', 0, 'left', px), ao('2pLy', '2p', 0, 'left', py), ao('2pLz', '2p', 0, 'left', pz),
            ao('2pRx', '2p', 0, 'right', px), ao('2pRy', '2p', 0, 'right', py), ao('2pRz', '2p', 0, 'right', pz),
            mo('sig2s', 'σ2s', e2s - ds, 'bonding', '2σg'),
            mo('sig2s*', 'σ*2s', e2s + 1.2 * ds, 'antibonding', '2σu'),
            mo('pi2px', 'π2p', pi2p, 'bonding', '1πu'),
            mo('pi2py', 'π2p', pi2p, 'bonding', '1πu'),
            mo('sig2p', 'σ2p', sigma2p, 'bonding', '3σg'),
            mo('pi2px*', 'π*2p', 2.4, 'antibonding', '1πg'),
            mo('pi2py*', 'π*2p', 2.4, 'antibonding', '1πg'),
            mo('sig2p*', 'σ*2p', 4.2, 'antibonding', '3σu'),
        ],
        interactions: [
            { from: '2sL', to: 'sig2s' }, { from: '2sR', to: 'sig2s' },
            { from: '2sL', to: 'sig2s*' }, { from: '2sR', to: 'sig2s*' },
            { from: '2pLx', to: 'pi2px' }, { from: '2pRx', to: 'pi2px' },
            { from: '2pLy', to: 'pi2py' }, { from: '2pRy', to: 'pi2py' },
            { from: '2pLz', to: 'sig2p' }, { from: '2pRz', to: 'sig2p' },
            { from: '2pLx', to: 'pi2px*' }, { from: '2pRx', to: 'pi2px*' },
            { from: '2pLy', to: 'pi2py*' }, { from: '2pRy', to: 'pi2py*' },
            { from: '2pLz', to: 'sig2p*' }, { from: '2pRz', to: 'sig2p*' },
        ],
    };
}

const molecules: Record<string, MoleculeData> = {
    'H2': makeFirstRow('H₂', 1,
        'Two 1s orbitals combine into a bonding σ1s and an antibonding σ*1s MO. Both electrons occupy σ1s, giving a single bond (bond order 1).'),
    'He2': makeFirstRow('He₂', 2,
        'Four electrons fill both σ1s and σ*1s. The antibonding electrons cancel the bonding ones, so the bond order is 0 and He₂ is not a stable molecule.'),
    'Li2': makeSecondRow('Li₂', 1, 4, true,
        'Only the σ2s bonding MO is occupied: bond order 1. The 2s–2p gap is small, so 2s/2p mixing places σ2p (3σg) above π2p.'),
    'Be2': makeSecondRow('Be₂', 2, 5, true,
        'σ2s and σ*2s are both full, so the bond order is 0. (Real Be₂ is only a very weakly bound van der Waals dimer.)'),
    'B2': makeSecondRow('B₂', 3, 6, true,
        'Because s–p mixing puts π2p below σ2p, the last two electrons go one each into the degenerate π2p pair (Hund\'s rule). B₂ is paramagnetic, which is experimental evidence for s–p mixing.'),
    'C2': makeSecondRow('C₂', 4, 7, true,
        'The π2p pair is filled while σ2p stays empty (s–p mixed ordering). Bond order 2 made of two π bonds, and diamagnetic.'),
    'N2': makeSecondRow('N₂', 5, 8, true,
        'Triple bond (bond order 3). s–p mixing still places σ2p (3σg) above π2p, so σ2p is the HOMO.'),
    'O2': makeSecondRow('O₂', 6, 10, false,
        'The larger 2s–2p gap switches off s–p mixing, so σ2p drops below π2p. The two electrons in the degenerate π* pair are unpaired: O₂ is paramagnetic with bond order 2.'),
    'F2': makeSecondRow('F₂', 7, 12, false,
        'All bonding orbitals and both π* orbitals are filled. Bond order 1, diamagnetic.'),
    'Ne2': makeSecondRow('Ne₂', 8, 14, false,
        'Every bonding and antibonding MO is full, so the bond order is 0 and Ne₂ does not form a stable molecule.'),
    'HF': {
        name: 'HF',
        description: 'The low-lying F 2s stays essentially nonbonding (1σ). H 1s mixes only with F 2pz to form the 2σ bond; F 2px and 2py have no partner of matching symmetry and remain nonbonding lone pairs (1π). Bond order 1. The 2σ MO sits closer in energy to F, so the bond is polarized toward fluorine. Energies are approximate valence orbital ionization energies (eV).',
        valenceElectrons: 8,
        levels: [
            ao('H1s', 'H 1s', -13.6, 'left', 1),
            ao('F2s', 'F 2s', -40.2, 'right', 2),
            ao('F2px', 'F 2p', -18.7, 'right', 2), ao('F2py', 'F 2p', -18.7, 'right', 2), ao('F2pz', 'F 2p', -18.7, 'right', 1),
            mo('1sig', '1σ', -40.6, 'nonbonding', 'nonbonding'),
            mo('2sig', '2σ', -21.5, 'bonding'),
            mo('1pix', '1π', -18.7, 'nonbonding', 'nonbonding'),
            mo('1piy', '1π', -18.7, 'nonbonding', 'nonbonding'),
            mo('3sig*', '3σ*', -6, 'antibonding'),
        ],
        interactions: [
            { from: 'F2s', to: '1sig' },
            { from: 'H1s', to: '2sig' }, { from: 'F2pz', to: '2sig' },
            { from: 'F2px', to: '1pix' }, { from: 'F2py', to: '1piy' },
            { from: 'H1s', to: '3sig*' }, { from: 'F2pz', to: '3sig*' },
        ],
    },
    'CO': {
        name: 'CO',
        description: 'Isoelectronic with N₂ (bond order 3), but the O orbitals lie lower than the C orbitals, so bonding MOs have more O character and antibonding MOs more C character. The HOMO (5σ) is a carbon-centred lone pair, which is why CO binds to metals through carbon. Energies are schematic (deep 2s levels compressed).',
        valenceElectrons: 10,
        levels: [
            ao('C2s', 'C 2s', -19.4, 'left', 2),
            ao('C2px', 'C 2p', -10.7, 'left', 1), ao('C2py', 'C 2p', -10.7, 'left', 1), ao('C2pz', 'C 2p', -10.7, 'left', 0),
            ao('O2s', 'O 2s', -27, 'right', 2),
            ao('O2px', 'O 2p', -15.9, 'right', 2), ao('O2py', 'O 2p', -15.9, 'right', 1), ao('O2pz', 'O 2p', -15.9, 'right', 1),
            mo('3sig', '3σ', -30, 'bonding'),
            mo('4sig', '4σ*', -19.7, 'antibonding'),
            mo('1pix', '1π', -16.9, 'bonding'),
            mo('1piy', '1π', -16.9, 'bonding'),
            mo('5sig', '5σ', -14, 'bonding'),
            mo('2pix*', '2π*', -5, 'antibonding'),
            mo('2piy*', '2π*', -5, 'antibonding'),
            mo('6sig*', '6σ*', 0, 'antibonding'),
        ],
        interactions: [
            { from: 'C2s', to: '3sig' }, { from: 'O2s', to: '3sig' },
            { from: 'C2s', to: '4sig' }, { from: 'O2s', to: '4sig' },
            { from: 'C2px', to: '1pix' }, { from: 'O2px', to: '1pix' },
            { from: 'C2py', to: '1piy' }, { from: 'O2py', to: '1piy' },
            { from: 'C2pz', to: '5sig' }, { from: 'O2pz', to: '5sig' },
            { from: 'C2px', to: '2pix*' }, { from: 'O2px', to: '2pix*' },
            { from: 'C2py', to: '2piy*' }, { from: 'O2py', to: '2piy*' },
            { from: 'C2pz', to: '6sig*' }, { from: 'O2pz', to: '6sig*' },
        ],
    },
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
    const bonding = moLevels.filter(l => l.character === 'bonding').reduce((acc, curr) => acc + curr.electrons, 0);
    const antibonding = moLevels.filter(l => l.character === 'antibonding').reduce((acc, curr) => acc + curr.electrons, 0);
    const bondOrder = (bonding - antibonding) / 2;
    const isParamagnetic = moLevels.some(l => l.electrons === 1);

    const filledLevels = moLevels.filter(l => l.electrons > 0).sort((a, b) => b.energy - a.energy);
    const unfilledLevels = moLevels.filter(l => l.electrons < 2).sort((a, b) => a.energy - b.energy);

    // A half-filled HOMO (e.g. O₂ π*, B₂ π) is a singly occupied MO
    const homo = filledLevels[0]
        ? filledLevels[0].label + (filledLevels[0].electrons === 1 ? ' (SOMO)' : '')
        : 'None';
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
