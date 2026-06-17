// Shared primitives for both directions

const CATEGORIES = [
  {id:'cf', num:'01', title:'Failure of Classical Mechanics', count:2, weeks:'Wk 01–02',
   sims:[
    {id:'pe', title:'Photoelectric Effect', sub:'Threshold frequency · work function', weeks:'Week 02'},
    {id:'bb', title:'Black Body Radiation', sub:'Planck\u2019s law · UV catastrophe', weeks:'Week 01'},
   ]},
  {id:'iq', num:'02', title:'Idealized Quantum Systems', count:3, weeks:'Wk 03–05',
   sims:[
    {id:'p1', title:'Particle in a Box (1D)', sub:'Wavefunctions · quantization', weeks:'Week 03'},
    {id:'p2', title:'Particle in a Box (2D)', sub:'Contour plots · degeneracy', weeks:'Week 04'},
    {id:'tu', title:'Quantum Tunneling', sub:'Finite barrier · transmission', weeks:'Week 05'},
   ]},
  {id:'ns', num:'03', title:'Nuclear Spectroscopy', count:3, weeks:'Wk 06–08',
   sims:[
    {id:'ir', title:'Vibrational Spectra', sub:'IR · harmonic oscillator', weeks:'Week 06'},
    {id:'ro', title:'Rotational Spectra', sub:'Microwave · rigid rotor', weeks:'Week 07'},
    {id:'vr', title:'Vibrational-Rotational', sub:'P / Q / R branches', weeks:'Week 08'},
   ]},
  {id:'at', num:'04', title:'Atomic Systems', count:3, weeks:'Wk 09–11',
   sims:[
    {id:'bo', title:'Bohr Model', sub:'Orbits · spectral lines', weeks:'Week 09'},
    {id:'or', title:'Atomic Orbitals', sub:'3D probability density', weeks:'Week 10'},
    {id:'hy', title:'Orbital Hybridization', sub:'sp · sp² · sp³', weeks:'Week 11'},
   ]},
  {id:'mo', num:'05', title:'Molecular Systems', count:1, weeks:'Wk 12–14',
   sims:[
    {id:'md', title:'Diatomic MO Schemes', sub:'Bonding · antibonding', weeks:'Week 12'},
   ]},
];

// Photoelectric effect scene — reusable SVG
function PhotoelectricScene({bg='#0a0612', accent='#c8892a', compact=false}){
  const h = compact? 150 : 220;
  return (
    <svg viewBox={`0 0 360 ${h}`} style={{display:'block',width:'100%',height:h,background:bg,borderRadius:compact?6:0}}>
      {/* grid */}
      <defs>
        <pattern id="pgrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="360" height={h} fill="url(#pgrid)"/>
      {/* metal plate */}
      <rect x="40" y={h*0.25} width="14" height={h*0.5} fill="#8a8f99"/>
      <rect x="38" y={h*0.25} width="2" height={h*0.5} fill="#cfd3dc"/>
      {/* incoming photons */}
      {[0,1,2,3,4].map(i=>(
        <g key={i}>
          <line x1={260-i*34} x2={60} y1={h*0.35+i*8} y2={h*0.45+i*6} stroke={accent} strokeWidth="1.5" opacity={0.85-i*0.12}/>
          <circle cx={260-i*34} cy={h*0.35+i*8} r="2.5" fill={accent} opacity={0.85-i*0.12}/>
        </g>
      ))}
      {/* ejected electrons */}
      {[0,1,2].map(i=>(
        <g key={i}>
          <circle cx={60+i*26} cy={h*0.5-i*14} r="3" fill="#7cc4ff"/>
          <line x1={54} y1={h*0.5} x2={60+i*26} y2={h*0.5-i*14} stroke="#7cc4ff" strokeWidth="0.8" opacity="0.4"/>
        </g>
      ))}
      {/* labels */}
      <text x="24" y={h-10} fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.5)">CATHODE · Cs</text>
      <text x="260" y={h-10} fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.5)" textAnchor="start">ν = 5.5×10¹⁴ Hz</text>
    </svg>
  );
}

function KEGraph({stroke='#340E51', w=320, h=120, mono=false}){
  // Simple KE vs frequency line with cutoff
  const pts = [];
  for(let i=0;i<=40;i++){
    const f = i/40;
    const ke = f < 0.3 ? 0 : (f-0.3)*1.4;
    pts.push(`${10+f*(w-20)},${h-10-ke*(h-30)}`);
  }
  const font = mono? 'JetBrains Mono,monospace' : 'Inter,sans-serif';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:'auto',display:'block'}}>
      {/* axes */}
      <line x1="10" y1={h-10} x2={w-10} y2={h-10} stroke="#bdb6a8" strokeWidth="0.5"/>
      <line x1="10" y1="10" x2="10" y2={h-10} stroke="#bdb6a8" strokeWidth="0.5"/>
      {/* gridlines */}
      {[0.25,0.5,0.75].map(t=>(
        <line key={t} x1={10+t*(w-20)} y1="10" x2={10+t*(w-20)} y2={h-10} stroke="#e2dbc9" strokeWidth="0.5" strokeDasharray="2 2"/>
      ))}
      {/* threshold marker */}
      <line x1={10+0.3*(w-20)} y1="10" x2={10+0.3*(w-20)} y2={h-10} stroke={stroke} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5"/>
      <text x={10+0.3*(w-20)+4} y="18" fontFamily={font} fontSize="8" fill={stroke}>ν₀</text>
      {/* curve */}
      <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth="1.8"/>
      {/* labels */}
      <text x={w-10} y={h-14} fontFamily={font} fontSize="8" fill="#7b7681" textAnchor="end">ν (Hz)</text>
      <text x="14" y="18" fontFamily={font} fontSize="8" fill="#7b7681">KE (eV)</text>
    </svg>
  );
}

Object.assign(window, {CATEGORIES, PhotoelectricScene, KEGraph});
