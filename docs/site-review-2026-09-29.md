# QuantumChem site review — 2026-09-29

Scope: every page of the live site (https://jolayfield.github.io/CHEM332-content/) and the synced `main` source.
Method: link crawl of the live site, visual and console check of each page (desktop and 375 px mobile), `tsc --noEmit`, and a read-through of every simulation's source for physics, code, and teaching issues. Every item marked ✔ was checked by hand against the source or the live site.

---

## P0: broken for students right now

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 ✔ | **"‹ Back" 404s on all 13 simulation pages.** Absolute `/simulations.html` escapes the `/CHEM332-content/` Pages subpath. | every `*.html` line ~12 `.nav-back` | `href="simulations.html"` |
| 2 ✔ | **8 of 12 MO molecule chips do nothing** (He₂, Li₂, Be₂, B₂, C₂, Ne₂, HF, CO). The chip highlights, but the previous molecule's diagram stays on screen under the new label. B₂/C₂ are *the* s–p mixing examples. | `mo-scheme.ts:14–130, 190` | Add data, or hide the chips until data exists |
| 3 ✔ | **Tunneling T at E = V₀ is wrong** (ad-hoc `0.26·(aV₀)²`). At the defaults T = 0.38 vs the correct 0.11, which puts a spike in the T(E) graph. | `barrierSimulation.ts:70`, `transmissionGraph.ts:38` | `factor = 6.56·V₀·a²` (i.e. mV₀a²/2ħ², electron, nm/eV) |
| 4 ✔ | **Blackbody wavelength tick labels misplaced.** Labels 500/1000/… sit at 0.2/0.4/… of a linear 100–2500 nm axis, so "500" is really 580 nm. | `blackbody.ts:278–279` | position = `(λ−100)/2400` |
| 5 ✔ | **Photoelectric: gold can never emit.** The slider minimum is 250 nm (4.96 eV) but Φ(Au) = 5.1 eV; copper only emits over 250–264 nm. | `photoelectric.html:65` | min ≈ 200 nm |
| 6 | **Home "Continue / progress" card is fake.** `qc.progress` is read but never written, so it always shows 0%. The Contents, ☰ and ☆ buttons have no handlers, and there is no theme toggle anywhere. | `landing.ts`, all nav bars | Wire up, or remove until real |
| 7 ✔ | **Mobile horizontal scroll** on rot-spectra (773 px wide at a 375 px viewport) and vibrot-spectra (648 px) because the stats rows don't wrap. On rot-spectra, the Figure 3.3 caption overlaps the chart above. | `.stat-item` rows | Use `.readouts` k/v markup or `flex-wrap` |

## P1: physics/chemistry correctness

**Atomic orbitals**
- ✔ The radial normalization uses the old `(n+l)!³` convention with the modern Laguerre recurrence (`orbitals-math.ts:80`). ∫R²r² gives 1s = 1, 2p = 0.028, 3d ≈ 7e-5. Because the scatter threshold is absolute, high-n,l orbitals come out nearly empty.
- The real p/d lobes keep the Condon–Shortley phase, so the +x lobe of p_x is coloured negative.
- The polar axis is three.js Z (toward the camera), which breaks the site's chem-axis convention (Z vertical). There are no axis labels. The readout says "2p (1)" rather than 2p_x.

**MO scheme**
- The π2p bonding level is drawn *above* the parent 2p AO for N₂/O₂/F₂. Bonding MOs must sit below it.
- Degenerate levels are offset by only 20 px against 40–60 px bars, so the π pair and the 2p AOs overprint into one bar.
- O₂ HOMO = LUMO = π*. Label it SOMO.

**Hybridization**
- The Gaussian p normalization is √(3ζ) instead of 2√ζ, so the drawn sp³ lobe is about 31% s while the text says 25%.
- The "90% surface" accumulates |ψ| instead of ψ².

**Bohr**
- ✔ The radius is drawn linear in n (`bohrSimulation.ts:72`) while the caption says r ∝ n². Use n² or label "not to scale".
- The Balmer SVG line positions are wrong (`bohr.html:89–101`); correct x ≈ 21 / 49 / 107 / 300.
- Lyman lines are drawn violet and Paschen red, but both are invisible (UV/IR).
- The energy diagram uses an undisclosed √ scale and has no n = ∞ line.
- n_i = n_f gives a readout of "Infinity nm".

**2D box**
- The degeneracy check only catches the (a,b)↔(b,a) swap. It misses (1,7)/(7,1)/(5,5) = 50 and rectangular-box degeneracies such as (4,1) ≡ (2,2) at Lx = 2Ly.

**Photoelectric**
- Every electron is emitted with exactly KE_max.
- The KE–ν line isn't extended to the −Φ intercept, so students can't read h and Φ off a Millikan plot.

**IR**
- ✔ CO₂ intensities are inverted (ν₃ at 2349 should be about 10× ν₂).
- H₂O ordering is wrong (the bend is the strongest band).
- T is computed as `100(1−A)` instead of `10^−A`.
- E_v = hν̃(v+½) is missing the c.
- The "frequency shift" slider has no physical meaning.

**Rotational**
- ✔ N₂ is offered, but it has no microwave spectrum (no dipole). Make it a Raman example or remove it.
- Intensity is N_J only; the line-strength and (1 − e^−hν/kT) factors are missing.
- The x-axis is categorical, so HF and CO line spacings look identical.

**Vib-rot**
- The field labelled ν̃_e is actually the band origin ν̃₀ (HCl ωe = 2990.9, ν̃₀ = 2886).
- HBr B₀ is really Be. The correct values are B₀ = 8.351 and B₁ = 8.118.
- The NO Q-branch explanation is wrong: it comes from Λ = 1, not "non-linear".
- "Centrifugal distortion & αe" is mislabelled; αe is vibration–rotation coupling.
- Branches are converted to T separately and never summed, and an empty Q series draws a flat line.

**Basis set** (unlinked page)
- The contraction coefficients are unused.
- The 6-31G and cc-pVDZ exponents are invented.
- The overlap is 1D and always at R = 0.
- `--glass-bg` is undefined, so the canvas background is wrong.
- Keep this page hidden until it is rebuilt.

## P2: site structure and content plumbing

- **Basis Set page is built but unreachable.** The chapter list is hard-coded twice (`landing.ts` and `simulations.ts`); move it to one `src/chapters.ts`.
- **Lectures are orphaned.** About 16 MB of lecture `.md`/`.pdf` still deploys, but nothing links to it (the viewer was removed in 23a8875). `marked` is now unused. The new `Lecture_34_Supplement_Secular_Equation_Derivation.pdf` is untracked, so it won't deploy.
  - **Recommendation:** add a "Related lecture" link to the PDF on each simulation page, and stop shipping the `.md` files. Mapping:

| Simulation | Lectures |
|---|---|
| blackbody | L1 |
| photoelectric | L2 |
| particlebox | L6–9, L13 |
| particlebox2d | L11 |
| barrier | L12 |
| ir-spectra | L18–20, L23 |
| rot-spectra | L21–22 |
| vibrot-spectra | L24 |
| atomic-orbitals | L25–26 |
| bohr | L27 |
| mo-scheme | L34 (+Supplement), L35 |
| hybridization | L36–37 |
| basis-set | L29, L34, L40 |

- **Chapter "weeks" disagree with the lecture schedule.** Spectroscopy is labelled Weeks 5–6 but is taught in 7–8; Atomic is labelled 7–8 but is Week 9; MO is labelled 9–10 but is Week 12. The "Spring 2026" eyebrow is stale.
- **Section numbering:** photoelectric is §1.1 and blackbody §1.2, which is the reverse of the historical and lecture order (L1 blackbody → L2 photoelectric).
- **33 TypeScript errors** (`tsc --noEmit`, mostly rot/vibrot/ir/basis-set), and CI never type-checks.
- **Deploy workflow:** Node 20 is EOL, so move to 22. Remove `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`, add `workflow_dispatch`, and remove the legacy `gh-pages` script and branch.
- **Repo clutter:** three `Quantum App*.zip` files and the duplicate `design_handoff_quantumchem_redesign 2/` folder at the root. They aren't shipped, but they should be moved to `docs/design/` or deleted, and `*.zip` added to `.gitignore`.

## P3: rendering and design (site-wide)

- **No devicePixelRatio scaling on any canvas**, so every plot is blurry on Retina screens and phones. A shared `setupHiDPICanvas()` helper, driven by a `ResizeObserver`, fixes all pages at once.
- **Low-contrast canvas text:**
  - The 2D box draws #636e72/#2d3436 labels on a #0a0612 background, so they are unreadable.
  - Barrier region labels, MO `#aaa` labels, and Chart.js tick labels on the spectroscopy pages are tiny and dim.
  - Canvas fonts are Arial/Merriweather instead of the page's Lora/Lato.
- **Readout units are wiped.** `.textContent` writes delete the `<span class="unit">` (blackbody, photoelectric, bohr).
- **Bohr canvas is only 320 px tall**, so higher orbits clip and the orbit labels are tiny.
- **2D box plot is small** and floats in a mostly empty dark band.
- **Default 3D camera angles hide the shape.** The sp³ hybrid is viewed end-on (it looks like a sphere), and the 2p scatter shows overlapping lobes. Start from an oblique view.
- **Mode chips stay highlighted.** The orbitals Scatter/Surface chips toggle `active` but the HTML uses `on`, so both look selected. Several labels never update (`#viz-mode-label`, `#val-z-ctrl`, `#hyb-type-label`, `#display-label`).
- **Accessibility and meta:**
  - No `<canvas>` has `role="img"` or an `aria-label`.
  - Headings skip levels (h1 → h3/h4).
  - No meta description or OpenGraph tags.
  - Some `<label>`s have no `for`.

## Per-page improvement ideas (top picks)

| Page | Better simulation | Better text |
|---|---|---|
| Blackbody | Multi-T overlay or absolute-radiance mode with a σT⁴ readout; ν_peak marker; scale ν_max with T | UV catastrophe, Wien's law, Planck's quantization; "predict the peak at 3000 K" |
| Photoelectric | All four metals' KE–ν lines (slope h, intercept −Φ); stopping-voltage slider with I–V curves at two intensities | "Raise intensity at 700 nm on Cs — what happens?" |
| Bohr | Light up the actual spectral line on each transition; extend the axis to UV/IR series; Z selector (He⁺, Li²⁺) | Rydberg formula derivation, and where Bohr fails |
| PIB 1D | ⟨x⟩(t) marker and ⟨E⟩ readout for superpositions; autoscale; stacked ψₙ-on-Eₙ view; classical overlay at large n | Boundary conditions, why n ≥ 1, node counting; E in eV for an electron in a 1 nm box |
| PIB 2D | Correct degeneracy finder showing partners side by side; energy ladder showing splitting as Lx ≠ Ly | Separability, nodal lines; "break the (2,1)/(1,2) degeneracy" |
| Tunneling | True piecewise ψ with matched coefficients; log₁₀T; mark resonances on T(E); particle-mass selector (e⁻/H/D → kinetic isotope effect); wave-packet mode | κ, thin-barrier approximation, STM and H-transfer tunneling |
| Orbitals | Linked r²R² radial-distribution plot marking radial nodes; nodal-plane toggle; chem axes and labels | Angular vs radial nodes, n−l−1 rule |
| MO scheme | All 12 molecules; s–p mixing slider moving 3σg across 1πu; MO shape thumbnails on hover; heteronuclear skew for HF/CO | Why B₂ is paramagnetic; bond order ↔ bond length/energy trends |
| Hybridization | "Show all hybrids" overlay plus ghost unhybridized p orbitals; continuous spⁿ slider with a live cos θ = −1/n angle | σ/π framework in ethene and ethyne |
| IR | Real km/mol intensities; isotope substitution (D₂O, ¹³CO₂) in place of the shift slider; animated normal-mode arrows with the symmetry label | 3N−5/3N−6 counter; CO₂ Fermi resonance |
| Rotational | Linear frequency axis for comparing molecules; centrifugal distortion D; Boltzmann curve overlaid on the spectrum | "Invert the spectrum" exercise: measure 2B and compute r_e, with isotopologues |
| Vib-rot | H³⁵Cl/H³⁷Cl doublet (75:25); Hönl–London intensities; hover a line to highlight its transition on an energy-ladder inset; combination-differences tool | Separate ωe, ωexe and ν̃₀; fix the Q-branch and αe text |

**Cross-cutting teaching upgrade:** blackbody, both particle-in-a-box pages, and tunneling have essentially no explanatory prose. Adopt a standard block on every page:
- a 2–3 paragraph "What you're seeing"
- 2–3 "Try this / predict first" prompts
- a "Related lecture" PDF link
