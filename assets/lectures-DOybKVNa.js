import"./style-BGpXM_Ix.js";const r=document.getElementById("weeks-container"),i=Array.from({length:14},(o,e)=>e+1);r&&(r.innerHTML=i.map(e=>{const s=e.toString().padStart(2,"0"),t=(e-1)*3+1,l=[t,t+1,t+2];return`
            <div class="glass-panel feature-card">
              <h3>Week ${e}</h3>
              <p>Notes and materials for week ${e} of CHEM 332.</p>
              
              <div class="lecture-links-group" style="margin-top: 1rem;">
                <div style="font-weight: bold; margin-bottom: 0.5rem; color: var(--st-thomas-purple);">Lecture Notes</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <a href="lecture-view.html?week=${s}&lecture=README" class="text-link" style="font-size: 0.85em;">Overview</a>
                  ${l.map(a=>{const n=a.toString().padStart(2,"0");return`<a href="lecture-view.html?week=${s}&lecture=Lecture_${n}" class="text-link" style="font-size: 0.85em;">L${a}</a>`}).join("")}
                </div>
              </div>
            </div>
        `}).join(""),r.querySelectorAll(".feature-card").forEach(e=>{e.addEventListener("mouseenter",()=>{e.style.transform="translateY(-5px)",e.style.boxShadow="0 10px 20px rgba(0,0,0,0.1)"}),e.addEventListener("mouseleave",()=>{e.style.transform="translateY(0)",e.style.boxShadow="0 4px 30px rgba(0, 0, 0, 0.05)"})}));
