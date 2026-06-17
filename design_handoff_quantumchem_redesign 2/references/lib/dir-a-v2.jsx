// Direction A — expanded sim scenes
// Polished Home + Photoelectric + Bohr + Orbitals + IR Spectra

const A_DISPLAY = "'Fraunces', serif";
const A_BODY = "'Newsreader', serif";
const A_MONO = "'JetBrains Mono', monospace";
const A_PAPER = '#f4f1ec';
const A_PAPER_2 = '#ece7df';
const A_INK = '#1a1520';
const A_INK_2 = '#4b4554';
const A_INK_3 = '#7b7681';
const A_LINE = '#d9d2c5';

// ════════ Shared ════════
function ABrand(){
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <svg width="22" height="22" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.35"/>
        <circle cx="100" cy="100" r="46" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.35"/>
        <circle cx="170" cy="100" r="8" fill="currentColor"/>
        <circle cx="30" cy="100" r="8" fill="currentColor"/>
        <circle cx="100" cy="100" r="14" fill="currentColor"/>
      </svg>
      <span style={{fontFamily:A_DISPLAY,fontWeight:500,fontSize:18,letterSpacing:-0.2}}>QuantumChem</span>
    </div>
  );
}

function ABreadcrumb({parts}){
  return (
    <div style={{padding:'0 20px 10px',fontFamily:A_MONO,fontSize:10,letterSpacing:'.14em',
      textTransform:'uppercase',color:A_INK_3,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
      {parts.map((p,i)=>(
        <React.Fragment key={i}>
          {i>0 && <span style={{opacity:0.45}}>/</span>}
          <span style={{color:i===parts.length-1?A_INK:A_INK_3,fontWeight:i===parts.length-1?600:400}}>{p}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function AHeader({chapter,title}){
  return (
    <div style={{padding:'0 20px 14px'}}>
      <div style={{fontFamily:A_MONO,fontSize:10,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--accent,#340E51)',marginBottom:8}} data-accent="color">{chapter}</div>
      <h1 style={{fontFamily:A_DISPLAY,fontWeight:500,fontSize:32,lineHeight:1.05,letterSpacing:-0.7,margin:0,color:A_INK}}>{title}</h1>
    </div>
  );
}

function ATopBar({left='Back',right,mid}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 20px 14px'}}>
      <button style={{background:'none',border:0,color:A_INK,padding:0,display:'flex',alignItems:'center',gap:6,fontFamily:A_MONO,fontSize:10,letterSpacing:'.18em',textTransform:'uppercase'}}>
        <svg width="10" height="16" viewBox="0 0 10 16"><path d="M8 2l-6 6 6 6" fill="none" stroke={A_INK} strokeWidth="1.4"/></svg>
        {left}
      </button>
      <div style={{fontFamily:A_MONO,fontSize:10,letterSpacing:'.2em',color:A_INK_3,textTransform:'uppercase'}}>{mid}</div>
      {right || <span style={{width:14}}/>}
    </div>
  );
}

function ASlider({label,valueLabel,pct,gradient,markerLabel}){
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
        <span style={{fontFamily:A_DISPLAY,fontSize:14,fontWeight:500}}>{label}</span>
        <span style={{fontFamily:A_MONO,fontSize:11,color:A_INK_3}}>{valueLabel}</span>
      </div>
      {gradient ? (
        <div style={{height:8,background:gradient,position:'relative'}}>
          <div style={{position:'absolute',left:pct+'%',top:-2,width:4,height:12,background:A_INK}}/>
        </div>
      ) : (
        <div style={{height:2,background:A_LINE,position:'relative'}}>
          <div style={{position:'absolute',left:0,top:0,height:2,width:pct+'%',background:'var(--accent,#340E51)'}} data-accent="bg"/>
          <div style={{position:'absolute',left:pct+'%',top:-6,width:14,height:14,borderRadius:'50%',background:'var(--accent,#340E51)',transform:'translateX(-7px)'}} data-accent="bg"/>
        </div>
      )}
      {markerLabel && <div style={{fontFamily:A_BODY,fontStyle:'italic',fontSize:12,color:A_INK_3,marginTop:4}}>{markerLabel}</div>}
    </div>
  );
}

function AReadouts({items}){
  return (
    <div style={{display:'flex',gap:0,borderTop:`1px solid ${A_LINE}`,borderBottom:`1px solid ${A_LINE}`,padding:'10px 0',margin:'0 20px 14px'}}>
      {items.map((it,i)=>(
        <div key={i} style={{flex:1,paddingLeft:i>0?10:0,borderLeft:i>0?`1px solid ${A_LINE}`:'none'}}>
          <div style={{fontFamily:A_MONO,fontSize:9,letterSpacing:'.18em',color:A_INK_3,textTransform:'uppercase'}}>{it.k}</div>
          <div style={{fontFamily:A_DISPLAY,fontSize:20,fontWeight:500,letterSpacing:-0.3}}>{it.v}<span style={{color:A_INK_3,fontSize:12,marginLeft:4}}>{it.u}</span></div>
        </div>
      ))}
    </div>
  );
}

function AFigCaption({num,children}){
  return (
    <div style={{padding:'12px 20px 6px',fontFamily:A_MONO,fontSize:10,letterSpacing:'.18em',color:A_INK_3,textTransform:'uppercase'}}>
      Figure {num} · {children}
    </div>
  );
}

function KTeX({tex, display=true}){
  const ref = React.useRef(null);
  React.useEffect(()=>{
    const tryRender = ()=>{
      if(window.katex && ref.current){
        try { window.katex.render(tex, ref.current, {displayMode:display, throwOnError:false}); }
        catch(e){ ref.current.textContent = tex; }
      } else { setTimeout(tryRender, 200); }
    };
    tryRender();
  },[tex,display]);
  return <span ref={ref}/>;
}
window.KTeX = KTeX;

// ════════ 01 — HOME (polished) ════════
function A_Home(){
  const progressMap = {cf:1.0, iq:0.66, ns:0.33, at:0, mo:0};
  return (
    <IOSDevice width={380} height={820}>
      <div style={{background:A_PAPER,minHeight:'100%',paddingTop:54,paddingBottom:40,color:A_INK}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 20px 18px'}}>
          <button style={{background:'none',border:0,color:A_INK,padding:0,display:'flex',alignItems:'center',gap:6,fontFamily:A_MONO,fontSize:10,letterSpacing:'.18em',textTransform:'uppercase'}}>
            <svg width="16" height="12" viewBox="0 0 16 12"><path d="M1 2h14M1 6h14M1 10h14" stroke={A_INK} strokeWidth="1.2"/></svg>
            Contents
          </button>
          <ABrand/>
          <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="7" cy="7" r="5" fill="none" stroke={A_INK} strokeWidth="1.2"/><line x1="11" y1="11" x2="14" y2="14" stroke={A_INK} strokeWidth="1.2"/></svg>
        </div>
        <ABreadcrumb parts={['Home','Course Library','Spring \u201926']}/>
        <AHeader chapter="Course · Phys Chem II · Spring 2026" title={<>Quantum Mechanics, from <i style={{color:'var(--accent,#340E51)'}}>first failures</i> to molecular orbitals.</>}/>

        {/* Resume — evolved */}
        <div style={{margin:'6px 20px 22px',padding:'16px',background:'#fff',borderLeft:'3px solid var(--accent,#340E51)'}} data-accent="border">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
            <div style={{fontFamily:A_MONO,fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:A_INK_3}}>Continue reading</div>
            <div style={{fontFamily:A_MONO,fontSize:10,color:A_INK_3}}>5 min ago</div>
          </div>
          <div style={{fontFamily:A_DISPLAY,fontWeight:500,fontSize:19,marginTop:4,letterSpacing:-0.3}}>§ 2.1 · Photoelectric Effect</div>
          <div style={{fontFamily:A_BODY,fontSize:13,color:A_INK_2,marginTop:4,fontStyle:'italic',lineHeight:1.5}}>
            You stopped on Einstein's explanation; two more interactions remain.
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:12}}>
            <div style={{flex:1,display:'flex',gap:2}}>{Array.from({length:14}).map((_,i)=>(<div key={i} style={{flex:1,height:8,background:i<5?'var(--accent,#340E51)':A_LINE}} data-accent={i<5?'bg':''}/>))}</div>
            <div style={{fontFamily:A_MONO,fontSize:11,color:A_INK_3}}>05 / 14</div>
          </div>
        </div>

        {/* Overall progress strip */}
        <div style={{padding:'0 20px',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8,fontFamily:A_MONO,fontSize:10,letterSpacing:'.18em',color:A_INK_3,textTransform:'uppercase'}}>
            <span>Course progress</span>
            <span style={{color:A_INK,fontWeight:600}}>40%</span>
          </div>
          <div style={{display:'flex',gap:4}}>
            {CATEGORIES.map(c=>{
              const p = progressMap[c.id]||0;
              return (
                <div key={c.id} style={{flex:c.sims.length,height:24,background:A_PAPER_2,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',left:0,top:0,bottom:0,width:(p*100)+'%',background:'var(--accent,#340E51)'}} data-accent="bg"/>
                  <span style={{position:'absolute',top:6,left:6,fontFamily:A_MONO,fontSize:9,color:p>0.3?'#fff':A_INK_3,letterSpacing:'.06em',fontWeight:600}}>{c.num}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table of Contents */}
        <div style={{padding:'0 20px',fontFamily:A_MONO,fontSize:10,letterSpacing:'.22em',textTransform:'uppercase',color:A_INK_3,borderBottom:`1px solid ${A_LINE}`,paddingBottom:8,marginBottom:0}}>
          Table of Contents
        </div>
        {CATEGORIES.map(c=>{
          const p = progressMap[c.id]||0;
          const done = Math.round(p*c.sims.length);
          return (
            <div key={c.id} style={{padding:'16px 20px',borderBottom:`1px solid ${A_LINE}`}}>
              <div style={{display:'flex',gap:14,alignItems:'baseline'}}>
                <span style={{fontFamily:A_DISPLAY,fontStyle:'italic',fontWeight:400,fontSize:28,color:'var(--accent,#340E51)',minWidth:36,lineHeight:1}} data-accent="color">{c.num}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:A_DISPLAY,fontWeight:500,fontSize:17,lineHeight:1.18,letterSpacing:-0.2}}>{c.title}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6,fontFamily:A_MONO,fontSize:10,letterSpacing:'.1em',color:A_INK_3,textTransform:'uppercase'}}>
                    <span>{c.weeks}</span>
                    <span style={{opacity:0.4}}>·</span>
                    <span>{done}/{c.sims.length} done</span>
                  </div>
                  {/* mini progress */}
                  <div style={{display:'flex',gap:2,marginTop:6}}>
                    {c.sims.map((_,i)=>(
                      <div key={i} style={{flex:1,height:3,background:i<done?'var(--accent,#340E51)':A_LINE}} data-accent={i<done?'bg':''}/>
                    ))}
                  </div>
                </div>
                <svg width="10" height="16" viewBox="0 0 10 16" style={{alignSelf:'center'}}><path d="M2 2l6 6-6 6" fill="none" stroke={A_INK_3} strokeWidth="1.2"/></svg>
              </div>
            </div>
          );
        })}

        {/* Footer cite */}
        <div style={{padding:'22px 20px',textAlign:'center',fontFamily:A_BODY,fontStyle:'italic',fontSize:12,color:A_INK_3,lineHeight:1.55}}>
          "The more success the quantum theory has, the sillier it looks." <br/>
          <span style={{fontFamily:A_MONO,fontStyle:'normal',fontSize:10,letterSpacing:'.12em'}}>— A. EINSTEIN, 1912</span>
        </div>
      </div>
    </IOSDevice>
  );
}

// ════════ 02 — PHOTOELECTRIC ════════
function A_Photo(){
  return (
    <IOSDevice width={380} height={820}>
      <div style={{background:A_PAPER,minHeight:'100%',paddingTop:54,paddingBottom:40,color:A_INK}}>
        <ATopBar mid="§ 2.1" right={<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 5h10M7 2v10" stroke={A_INK} strokeWidth="1.2"/></svg>}/>
        <ABreadcrumb parts={['Ch 01','Classical Failures','Photoelectric']}/>
        <AHeader chapter="Chapter 01 · Section 2.1" title={<>The Photoelectric <i style={{color:'var(--accent,#340E51)'}}>Effect.</i></>}/>
        <AFigCaption num="2.1">Interactive</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,background:'#0a0612'}}>
          <PhotoelectricScene bg="#0a0612" accent="#c8892a"/>
        </div>
        <div style={{padding:'8px 20px 18px',fontFamily:A_BODY,fontSize:13,fontStyle:'italic',color:A_INK_2,lineHeight:1.5}}>
          Monochromatic light impinges on a caesium cathode. Electrons eject when <span style={{fontFamily:A_MONO,fontStyle:'normal',fontSize:12}}>hν ≥ Φ</span>.
        </div>

        <AReadouts items={[{k:'Intensity',v:'50',u:'%'},{k:'λ',v:'500',u:'nm'},{k:'KEmax',v:'0.38',u:'eV'}]}/>

        <div style={{padding:'0 20px'}}>
          <ASlider label="Intensity" valueLabel="50%" pct={50}/>
          <ASlider label="Wavelength" valueLabel="500 nm · green" pct={44} gradient="linear-gradient(90deg,#4b0082,#0000ff,#00ff00,#ffff00,#ff8000,#ff0000)"/>
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:A_DISPLAY,fontSize:14,fontWeight:500,marginBottom:6}}>Target metal</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[['Cs','2.1'],['Na','2.3'],['Cu','4.7'],['Au','5.1']].map(([m,phi],i)=>(
                <div key={m} style={{padding:'6px 10px',border:`1px solid ${i===0?'var(--accent,#340E51)':A_LINE}`,background:i===0?'var(--accent,#340E51)':'transparent',color:i===0?'#fff':A_INK,fontFamily:A_MONO,fontSize:11}} data-accent={i===0?'bg':''}>
                  {m} · Φ={phi}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AFigCaption num="2.2">KE vs Frequency</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,padding:'12px 8px 4px',background:'#fbf8f2'}}>
          <KEGraph stroke="var(--accent,#340E51)"/>
        </div>
        <div style={{padding:'8px 20px 0',fontFamily:A_BODY,fontStyle:'italic',fontSize:13,color:A_INK_2,lineHeight:1.5}}>
          Stopping‑potential points are recorded in the lab notebook as you vary ν.
        </div>
      </div>
    </IOSDevice>
  );
}

// ════════ Bohr Scene ════════
function BohrScene({n=3, bg='#0a0612'}){
  const h = 240, cx=180, cy=h/2;
  const radii=[30,54,82,114];
  const angle=[0, -0.5, 1.2, -1.6];
  return (
    <svg viewBox={`0 0 360 ${h}`} style={{display:'block',width:'100%',height:h,background:bg}}>
      <defs>
        <pattern id="bgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/></pattern>
      </defs>
      <rect width="360" height={h} fill="url(#bgrid)"/>
      {/* nucleus */}
      <circle cx={cx} cy={cy} r="8" fill="#ffb347"/>
      <circle cx={cx} cy={cy} r="14" fill="none" stroke="#ffb347" strokeWidth="0.6" opacity="0.4"/>
      {/* orbits */}
      {radii.map((r,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={i===n-1?'#c8892a':'rgba(255,255,255,0.2)'} strokeWidth={i===n-1?1.2:0.6} strokeDasharray={i===n-1?'':'2 3'}/>
      ))}
      {/* electrons */}
      {radii.map((r,i)=>(
        <g key={'e'+i}>
          <circle cx={cx+r*Math.cos(angle[i])} cy={cy+r*Math.sin(angle[i])} r={i===n-1?3.5:2.5} fill={i===n-1?'#7cc4ff':'rgba(124,196,255,0.5)'}/>
        </g>
      ))}
      {/* emitted photon (transition from n=3 → n=1) */}
      <g>
        <line x1={cx+radii[2]*Math.cos(angle[2])} y1={cy+radii[2]*Math.sin(angle[2])} x2="340" y2="40" stroke="#c8892a" strokeWidth="1.2" opacity="0.8"/>
        <path d="M300 60 q8 -12 16 0 q8 12 16 0" fill="none" stroke="#ffd580" strokeWidth="1.2"/>
        <text x="300" y="52" fontFamily="JetBrains Mono,monospace" fontSize="9" fill="#ffd580">hν</text>
      </g>
      {/* labels */}
      {radii.map((r,i)=>(
        <text key={'l'+i} x={cx+r+4} y={cy+4} fontFamily="JetBrains Mono,monospace" fontSize="8" fill="rgba(255,255,255,0.4)">n={i+1}</text>
      ))}
      <text x="12" y={h-10} fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.5)">Z = 1 · HYDROGEN</text>
    </svg>
  );
}

function SpectrumStrip(){
  const lines = [
    {pos:15, color:'#a855f7', label:'410'},
    {pos:28, color:'#818cf8', label:'434'},
    {pos:48, color:'#38bdf8', label:'486'},
    {pos:78, color:'#ef4444', label:'656'},
  ];
  return (
    <svg viewBox="0 0 360 60" style={{display:'block',width:'100%',height:60}}>
      <defs>
        <linearGradient id="visgrad" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#4b0082"/>
          <stop offset="20%" stopColor="#4f46e5"/>
          <stop offset="40%" stopColor="#06b6d4"/>
          <stop offset="60%" stopColor="#22c55e"/>
          <stop offset="80%" stopColor="#eab308"/>
          <stop offset="100%" stopColor="#dc2626"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="340" height="24" fill="#0a0612"/>
      <rect x="10" y="10" width="340" height="24" fill="url(#visgrad)" opacity="0.12"/>
      {lines.map((l,i)=>(
        <g key={i}>
          <line x1={10+l.pos*3.4} y1="10" x2={10+l.pos*3.4} y2="34" stroke={l.color} strokeWidth="1.8"/>
          <text x={10+l.pos*3.4} y="48" fontFamily="JetBrains Mono,monospace" fontSize="8" fill={l.color} textAnchor="middle">{l.label}</text>
        </g>
      ))}
      <text x="10" y="58" fontFamily="JetBrains Mono,monospace" fontSize="7" fill="#7b7681">400 nm</text>
      <text x="350" y="58" fontFamily="JetBrains Mono,monospace" fontSize="7" fill="#7b7681" textAnchor="end">700 nm</text>
    </svg>
  );
}

// ════════ 03 — BOHR ════════
function A_Bohr(){
  return (
    <IOSDevice width={380} height={820}>
      <div style={{background:A_PAPER,minHeight:'100%',paddingTop:54,paddingBottom:40,color:A_INK}}>
        <ATopBar mid="§ 4.1" right={<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 5h10M7 2v10" stroke={A_INK} strokeWidth="1.2"/></svg>}/>
        <ABreadcrumb parts={['Ch 04','Atomic Systems','Bohr']}/>
        <AHeader chapter="Chapter 04 · Section 4.1" title={<>The Bohr <i style={{color:'var(--accent,#340E51)'}}>Model.</i></>}/>

        <AFigCaption num="4.1">Hydrogen Atom · Interactive</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,background:'#0a0612'}}>
          <BohrScene n={3}/>
        </div>
        <div style={{padding:'8px 20px 18px',fontFamily:A_BODY,fontSize:13,fontStyle:'italic',color:A_INK_2,lineHeight:1.5}}>
          Quantized orbits with radii <span style={{fontFamily:A_MONO,fontStyle:'normal',fontSize:12}}>rₙ = n²a₀/Z</span>. Electron relaxation emits a photon of energy ΔE = hν.
        </div>

        <AReadouts items={[{k:'Z',v:'1',u:''},{k:'n',v:'3',u:'→1'},{k:'ΔE',v:'12.09',u:'eV'}]}/>

        <div style={{padding:'0 20px'}}>
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:A_DISPLAY,fontSize:14,fontWeight:500,marginBottom:6}}>Element</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[['H','1'],['He⁺','2'],['Li²⁺','3'],['Be³⁺','4']].map(([sym,z],i)=>(
                <div key={sym} style={{padding:'6px 10px',border:`1px solid ${i===0?'var(--accent,#340E51)':A_LINE}`,background:i===0?'var(--accent,#340E51)':'transparent',color:i===0?'#fff':A_INK,fontFamily:A_MONO,fontSize:11}} data-accent={i===0?'bg':''}>
                  {sym} · Z={z}
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <div style={{fontFamily:A_DISPLAY,fontSize:14,fontWeight:500,marginBottom:6}}>Transition n<sub>i</sub> → n<sub>f</sub></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,alignItems:'center'}}>
              <div style={{display:'flex',gap:4}}>
                {[2,3,4,5,6].map(n=>(
                  <div key={n} style={{flex:1,padding:'8px 0',textAlign:'center',fontFamily:A_MONO,fontSize:12,border:`1px solid ${n===3?'var(--accent,#340E51)':A_LINE}`,background:n===3?'var(--accent,#340E51)':'transparent',color:n===3?'#fff':A_INK}} data-accent={n===3?'bg':''}>{n}</div>
                ))}
              </div>
              <span style={{fontFamily:A_DISPLAY,fontSize:18,fontStyle:'italic',color:A_INK_3}}>→</span>
              <div style={{display:'flex',gap:4}}>
                {[1,2,3,4,5].map(n=>(
                  <div key={n} style={{flex:1,padding:'8px 0',textAlign:'center',fontFamily:A_MONO,fontSize:12,border:`1px solid ${n===1?'var(--accent,#340E51)':A_LINE}`,background:n===1?'var(--accent,#340E51)':'transparent',color:n===1?'#fff':A_INK}} data-accent={n===1?'bg':''}>{n}</div>
                ))}
              </div>
            </div>
          </div>

          <ASlider label="Series" valueLabel="Balmer (n→2)" pct={40}/>
        </div>

        <AFigCaption num="4.2">Emission Spectrum · Balmer</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,background:'#0a0612'}}>
          <SpectrumStrip/>
        </div>
        <div style={{padding:'8px 20px 0',fontFamily:A_BODY,fontStyle:'italic',fontSize:13,color:A_INK_2,lineHeight:1.5}}>
          Four visible lines in the Balmer series. Tap a line to see its originating transition.
        </div>
      </div>
    </IOSDevice>
  );
}

// ════════ Orbital Scene (pseudo-3D 2p_z cross-section) ════════
function OrbitalScene({type='2pz', bg='#0a0612'}){
  const h = 260, cx = 180, cy = h/2;
  // Render a radial density projection
  const shapes = {
    '1s': <circle cx={cx} cy={cy} r="50" fill="url(#sph)"/>,
    '2s': <g><circle cx={cx} cy={cy} r="68" fill="url(#sph)"/><circle cx={cx} cy={cy} r="28" fill="none" stroke="rgba(255,180,71,0.35)" strokeWidth="0.5" strokeDasharray="2 3"/></g>,
    '2pz': <g>
        <ellipse cx={cx} cy={cy-36} rx="28" ry="42" fill="url(#sph)" opacity="0.95"/>
        <ellipse cx={cx} cy={cy+36} rx="28" ry="42" fill="url(#sphN)" opacity="0.95"/>
      </g>,
    '3dz2': <g>
        <ellipse cx={cx} cy={cy-50} rx="20" ry="34" fill="url(#sph)"/>
        <ellipse cx={cx} cy={cy+50} rx="20" ry="34" fill="url(#sph)"/>
        <ellipse cx={cx} cy={cy} rx="60" ry="14" fill="url(#sphN)" opacity="0.55"/>
      </g>,
  };
  return (
    <svg viewBox={`0 0 360 ${h}`} style={{display:'block',width:'100%',height:h,background:bg}}>
      <defs>
        <radialGradient id="sph">
          <stop offset="0%" stopColor="#ffd580" stopOpacity="0.95"/>
          <stop offset="60%" stopColor="#c8892a" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#c8892a" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="sphN">
          <stop offset="0%" stopColor="#7cc4ff" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
        </radialGradient>
        <pattern id="orbgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/></pattern>
      </defs>
      <rect width="360" height={h} fill="url(#orbgrid)"/>
      {/* axes */}
      <line x1={cx} y1="20" x2={cx} y2={h-20} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
      <line x1="30" y1={cy} x2="330" y2={cy} stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
      <text x={cx+6} y="28" fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.5)">z</text>
      <text x="322" y={cy-4} fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.5)">x</text>
      {/* nucleus */}
      <circle cx={cx} cy={cy} r="2.5" fill="#fff"/>
      {shapes[type] || shapes['2pz']}
      <text x="14" y={h-12} fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.55)">ψ({type}) · xz-plane</text>
      <text x="346" y={h-12} fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,0.55)" textAnchor="end">|ψ|² · 95% iso</text>
    </svg>
  );
}

// ════════ 04 — ORBITALS ════════
function A_Orbitals(){
  const orbitals = [
    {k:'1s', ok:false},{k:'2s',ok:false},{k:'2px',ok:false},{k:'2py',ok:false},
    {k:'2pz',ok:true},{k:'3s',ok:false},{k:'3dz²',ok:false},{k:'3dxy',ok:false},
  ];
  return (
    <IOSDevice width={380} height={820}>
      <div style={{background:A_PAPER,minHeight:'100%',paddingTop:54,paddingBottom:40,color:A_INK}}>
        <ATopBar mid="§ 4.2" right={<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 5h10M7 2v10" stroke={A_INK} strokeWidth="1.2"/></svg>}/>
        <ABreadcrumb parts={['Ch 04','Atomic Systems','Orbitals']}/>
        <AHeader chapter="Chapter 04 · Section 4.2" title={<>Atomic <i style={{color:'var(--accent,#340E51)'}}>Orbitals.</i></>}/>

        <AFigCaption num="4.3">Probability Density · 2pz</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,background:'#0a0612'}}>
          <OrbitalScene type="2pz"/>
        </div>
        <div style={{padding:'8px 20px 14px',display:'flex',gap:8,alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:A_BODY,fontStyle:'italic',fontSize:13,color:A_INK_2,lineHeight:1.5,flex:1}}>
            Dumbbell lobes of opposite phase along <span style={{fontFamily:A_MONO,fontStyle:'normal',fontSize:12}}>z</span>. Nodal plane at <span style={{fontFamily:A_MONO,fontStyle:'normal',fontSize:12}}>z=0</span>.
          </div>
          <div style={{display:'flex',gap:4,fontFamily:A_MONO,fontSize:10,color:A_INK_3}}>
            <div style={{padding:'4px 8px',border:`1px solid ${A_LINE}`,background:'#fff'}}>Rotate</div>
            <div style={{padding:'4px 8px',border:`1px solid ${A_LINE}`,background:'#fff'}}>Slice</div>
          </div>
        </div>

        <AReadouts items={[{k:'n',v:'2',u:''},{k:'ℓ',v:'1',u:''},{k:'mℓ',v:'0',u:''}]}/>

        <div style={{padding:'0 20px 14px'}}>
          <div style={{fontFamily:A_DISPLAY,fontSize:14,fontWeight:500,marginBottom:6}}>Orbital</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
            {orbitals.map(o=>(
              <div key={o.k} style={{padding:'10px 0',textAlign:'center',fontFamily:A_MONO,fontSize:12,border:`1px solid ${o.ok?'var(--accent,#340E51)':A_LINE}`,background:o.ok?'var(--accent,#340E51)':'#fff',color:o.ok?'#fff':A_INK}} data-accent={o.ok?'bg':''}>{o.k}</div>
            ))}
          </div>
        </div>

        <div style={{padding:'0 20px'}}>
          <ASlider label="Iso value" valueLabel="0.95" pct={95} markerLabel="Higher values show only dense regions."/>
          <ASlider label="Z (effective)" valueLabel="1.00" pct={20}/>
        </div>

        <AFigCaption num="4.4">Radial Density R(r)²</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,padding:'12px 8px 4px',background:'#fbf8f2'}}>
          <svg viewBox="0 0 320 100" style={{width:'100%',height:'auto',display:'block'}}>
            <line x1="10" y1="90" x2="310" y2="90" stroke="#bdb6a8" strokeWidth="0.5"/>
            <line x1="10" y1="10" x2="10" y2="90" stroke="#bdb6a8" strokeWidth="0.5"/>
            <path d="M10 90 Q 50 90 80 30 Q 140 10 180 60 Q 240 88 310 86" fill="none" stroke="var(--accent,#340E51)" strokeWidth="1.8"/>
            <text x="14" y="20" fontFamily="JetBrains Mono,monospace" fontSize="8" fill="#7b7681">|R|²·r²</text>
            <text x="306" y="86" fontFamily="JetBrains Mono,monospace" fontSize="8" fill="#7b7681" textAnchor="end">r/a₀</text>
          </svg>
        </div>
      </div>
    </IOSDevice>
  );
}

// ════════ IR Scene ════════
function IRScene({bg='#0a0612'}){
  // Spectrum: wavenumber (x) vs transmittance (y). Dips at key bands.
  const h = 200, w = 360;
  const bands = [
    {x:0.82, d:0.6, w:0.015, l:'O-H', yl:28},
    {x:0.58, d:0.55, w:0.02, l:'C=O', yl:28},
    {x:0.43, d:0.3, w:0.03, l:'C-H', yl:44},
    {x:0.22, d:0.4, w:0.04, l:'C-O', yl:58},
  ];
  const pts = [];
  for(let i=0;i<=200;i++){
    const x = i/200;
    let y = 0.9;
    for(const b of bands){
      const d = Math.abs(x - b.x);
      y -= b.d * Math.exp(-(d*d)/(2*b.w*b.w));
    }
    pts.push(`${10+x*(w-20)},${h-20-y*(h-40)}`);
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{display:'block',width:'100%',height:h,background:bg}}>
      <defs>
        <pattern id="irgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/></pattern>
      </defs>
      <rect width={w} height={h} fill="url(#irgrid)"/>
      <line x1="10" y1={h-20} x2={w-10} y2={h-20} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <line x1="10" y1="20" x2="10" y2={h-20} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <polyline points={pts.join(' ')} fill="none" stroke="#ffd580" strokeWidth="1.6"/>
      {bands.map((b,i)=>{
        const x = 10 + b.x*(w-20);
        return (
          <g key={i}>
            <line x1={x} y1={h-20} x2={x} y2="36" stroke="#c8892a" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.5"/>
            <text x={x} y={b.yl} fontFamily="JetBrains Mono,monospace" fontSize="9" fill="#ffd580" textAnchor="middle">{b.l}</text>
          </g>
        );
      })}
      <text x="14" y="34" fontFamily="JetBrains Mono,monospace" fontSize="8" fill="rgba(255,255,255,0.5)">T (%)</text>
      <text x={w-14} y={h-6} fontFamily="JetBrains Mono,monospace" fontSize="8" fill="rgba(255,255,255,0.5)" textAnchor="end">ν̃ (cm⁻¹) · 4000 → 400</text>
    </svg>
  );
}

// ════════ 05 — IR SPECTRA ════════
function A_IR(){
  return (
    <IOSDevice width={380} height={820}>
      <div style={{background:A_PAPER,minHeight:'100%',paddingTop:54,paddingBottom:40,color:A_INK}}>
        <ATopBar mid="§ 3.1" right={<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 5h10M7 2v10" stroke={A_INK} strokeWidth="1.2"/></svg>}/>
        <ABreadcrumb parts={['Ch 03','Nuclear Spectroscopy','IR']}/>
        <AHeader chapter="Chapter 03 · Section 3.1" title={<>Vibrational <i style={{color:'var(--accent,#340E51)'}}>Spectra.</i></>}/>

        <AFigCaption num="3.1">IR Spectrum · Ethanol</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,background:'#0a0612'}}>
          <IRScene/>
        </div>
        <div style={{padding:'8px 20px 18px',fontFamily:A_BODY,fontSize:13,fontStyle:'italic',color:A_INK_2,lineHeight:1.5}}>
          Absorption bands report bond stiffness. Broad <span style={{fontFamily:A_MONO,fontStyle:'normal',fontSize:12}}>O–H</span> at ~3300 cm⁻¹; sharp <span style={{fontFamily:A_MONO,fontStyle:'normal',fontSize:12}}>C–H</span> stretches near 2900.
        </div>

        <AReadouts items={[{k:'μ',v:'0.94',u:'amu'},{k:'k',v:'520',u:'N/m'},{k:'ν̃',v:'3342',u:'cm⁻¹'}]}/>

        <div style={{padding:'0 20px'}}>
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:A_DISPLAY,fontSize:14,fontWeight:500,marginBottom:6}}>Molecule</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
              {[['Ethanol','C₂H₆O',true],['Acetone','C₃H₆O',false],['Water','H₂O',false],['HCl','HCl',false],['Benzene','C₆H₆',false],['CO₂','CO₂',false]].map(([n,f,on],i)=>(
                <div key={n} style={{padding:'8px 6px',textAlign:'center',border:`1px solid ${on?'var(--accent,#340E51)':A_LINE}`,background:on?'var(--accent,#340E51)':'#fff',color:on?'#fff':A_INK}} data-accent={on?'bg':''}>
                  <div style={{fontFamily:A_DISPLAY,fontSize:12,fontWeight:500}}>{n}</div>
                  <div style={{fontFamily:A_MONO,fontSize:10,opacity:on?0.85:0.55,marginTop:2}}>{f}</div>
                </div>
              ))}
            </div>
          </div>

          <ASlider label="Force constant k" valueLabel="520 N/m" pct={52} markerLabel="Stiffer bond → higher wavenumber."/>
          <ASlider label="Reduced mass μ" valueLabel="0.94 amu" pct={18}/>
        </div>

        <AFigCaption num="3.2">Characteristic Band Table</AFigCaption>
        <div style={{margin:'0 20px',border:`1px solid ${A_LINE}`,background:'#fff'}}>
          {[['O–H stretch','3200–3550','broad'],['C–H stretch','2850–3000','sharp'],['C=O stretch','1680–1750','very strong'],['C–O stretch','1050–1150','strong']].map(([bond,rng,note],i,arr)=>(
            <div key={bond} style={{display:'grid',gridTemplateColumns:'1.4fr 1.4fr 1fr',padding:'10px 12px',borderBottom:i<arr.length-1?`1px solid ${A_LINE}`:'none',alignItems:'baseline'}}>
              <div style={{fontFamily:A_DISPLAY,fontSize:13,fontWeight:500}}>{bond}</div>
              <div style={{fontFamily:A_MONO,fontSize:11,color:A_INK_2}}>{rng}</div>
              <div style={{fontFamily:A_BODY,fontStyle:'italic',fontSize:12,color:A_INK_3,textAlign:'right'}}>{note}</div>
            </div>
          ))}
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window,{A_Home, A_Photo, A_Bohr, A_Orbitals, A_IR});
