# Lecture 34 Supplement — Deriving the Secular Equation for H₂⁺

**Complete step-by-step derivation of the secular determinant and eigenvalue equations**

---

## 1. The Variational Principle & Linear Combinations of Atomic Orbitals (LCAO)

We construct molecular orbitals as linear combinations of hydrogen 1s atomic orbitals centered on nuclei A and B:

$$\psi_{\text{MO}} = c_A\phi_A + c_B\phi_B$$

where $\phi_A$ and $\phi_B$ are normalized hydrogen 1s wavefunctions. The **variational principle** states that any trial wavefunction yields an energy greater than or equal to the true ground state energy: $E[\psi] \geq E_0$. 

To find the best linear combination, we minimize $E$ with respect to the coefficients $c_A$ and $c_B$.

---

## 2. Setting Up the Energy Functional

The expectation value of the Hamiltonian operator is:

$$E(c_A, c_B) = \frac{\langle\psi|\hat{H}|\psi\rangle}{\langle\psi|\psi\rangle}$$

Expanding the numerator:

$$\langle\psi|\hat{H}|\psi\rangle = c_A^2 H_{AA} + c_B^2 H_{BB} + 2c_A c_B H_{AB}$$

where $H_{ij} = \langle\phi_i|\hat{H}|\phi_j\rangle$ are the Hamiltonian matrix elements.

The denominator (normalization) expands to:

$$\langle\psi|\psi\rangle = c_A^2 + c_B^2 + 2c_A c_B S_{AB}$$

where $S_{AB} = \langle\phi_A|\phi_B\rangle$ is the **overlap integral**. 

By symmetry of the homonuclear diatomic system:
- $H_{AA} = H_{BB} = \alpha$ (energy of electron in an isolated 1s orbital)
- $S_{AA} = S_{BB} = 1$ (orbitals are normalized)

---

## 3. Minimization Conditions: The Secular Equations

To minimize $E$, we set the partial derivatives with respect to $c_A$ and $c_B$ equal to zero:

$$\frac{\partial E}{\partial c_A} = 0 \quad \text{and} \quad \frac{\partial E}{\partial c_B} = 0$$

Applying the quotient rule and simplifying (after clearing denominators and rearranging), these conditions yield:

$$(H_{AA} - E)c_A + (H_{AB} - ES_{AB})c_B = 0$$

$$(H_{AB} - ES_{AB})c_A + (H_{BB} - E)c_B = 0$$

These are the **secular equations**. In matrix form:

$$\begin{pmatrix} H_{AA} - E & H_{AB} - ES_{AB} \\ H_{AB} - ES_{AB} & H_{BB} - E \end{pmatrix} \begin{pmatrix} c_A \\ c_B \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix}$$

---

## 4. The Secular Determinant

For a nontrivial solution (not both $c_A$ and $c_B$ equal to zero), the determinant of the coefficient matrix must vanish:

$$\det(H_{ij} - ES_{ij}) = 0$$

Explicitly:

$$\begin{vmatrix} H_{AA} - E & H_{AB} - ES_{AB} \\ H_{AB} - ES_{AB} & H_{BB} - E \end{vmatrix} = 0$$

Expanding:

$$(H_{AA} - E)(H_{BB} - E) - (H_{AB} - ES_{AB})^2 = 0$$

Using the symmetry relations ($H_{AA} = H_{BB} = \alpha$, $S_{AA} = S_{BB} = 1$), and letting $H_{AB} = \beta$ for convenience:

$$(\alpha - E)^2 - (\beta - ES_{AB})^2 = 0$$

This is the **secular determinant**—the condition that determines the allowed energies.

---

## 5. Solving for the Eigenvalues

The secular determinant factors as:

$$[(\alpha - E) + (\beta - ES_{AB})][(\alpha - E) - (\beta - ES_{AB})] = 0$$

This gives **two solutions**:

### Bonding Orbital ($\sigma$):

$$(\alpha - E) + (\beta - ES_{AB}) = 0$$

$$\alpha - E + \beta - ES_{AB} = 0$$

$$(\alpha + \beta) = E(1 + S_{AB})$$

$$E_+ = \frac{\alpha + \beta}{1 + S_{AB}}$$

Since $\beta$ is **negative** (the resonance integral is stabilizing), we have $E_+ < \alpha$. The bonding orbital is **lower in energy** than an isolated atomic orbital.

### Antibonding Orbital ($\sigma^*$):

$$(\alpha - E) - (\beta - ES_{AB}) = 0$$

$$\alpha - E - \beta + ES_{AB} = 0$$

$$(\alpha - \beta) = E(1 - S_{AB})$$

$$E_- = \frac{\alpha - \beta}{1 - S_{AB}}$$

Here $E_- > \alpha$. The antibonding orbital is **higher in energy**.

#### Key Observation: Asymmetry

Note that the antibonding orbital is **raised more** than the bonding orbital is lowered:

$$|E_- - \alpha| > |\alpha - E_+|$$

This occurs because $(1 - S_{AB}) < (1 + S_{AB})$, making the denominator in the antibonding expression smaller. This asymmetry has important consequences: it explains why He₂ does not form a stable molecule (the antibonding destabilization outweighs bonding stabilization).

---

## 6. Finding the Molecular Orbital Coefficients

Substituting each eigenvalue back into the secular equations determines the ratio $c_B/c_A$:

### For $E_+$ (Bonding):

Substituting $E_+$ into the first secular equation:

$$(H_{AA} - E_+)c_A + (H_{AB} - E_+ S_{AB})c_B = 0$$

The algebra shows that $c_A = c_B$. Normalizing with $\langle\psi_+|\psi_+\rangle = 1$:

$$\psi_+ = \frac{1}{\sqrt{2(1 + S_{AB})}}(\phi_A + \phi_B)$$

**Physical interpretation:** Constructive interference—the wavefunctions add, creating high electron density **between the nuclei**. This is why the bonding orbital is stabilized.

### For $E_-$ (Antibonding):

Substituting $E_-$ yields $c_A = -c_B$. Normalizing:

$$\psi_- = \frac{1}{\sqrt{2(1 - S_{AB})}}(\phi_A - \phi_B)$$

**Physical interpretation:** Destructive interference—the wavefunctions subtract. A **node** forms between the nuclei, depleting electron density from the internuclear region. This destabilizes the system.

---

## 7. Summary: Key Insights

| Quantity | Bonding ($E_+$) | Antibonding ($E_-$) |
|----------|-----------------|-------------------|
| **Energy** | $\frac{\alpha + \beta}{1 + S}$ | $\frac{\alpha - \beta}{1 - S}$ |
| **MO Form** | $\frac{1}{\sqrt{2(1+S)}}(\phi_A + \phi_B)$ | $\frac{1}{\sqrt{2(1-S)}}(\phi_A - \phi_B)$ |
| **Relative to $\alpha$** | $E_+ < \alpha$ | $E_- > \alpha$ |
| **Interference** | Constructive | Destructive |
| **Internuclear density** | Accumulated | Depleted (node) |

The secular equation analysis reveals that:
1. **Two molecular orbitals** emerge from the overlap of two atomic orbitals
2. **Energy depends on three integrals**: overlap ($S_{AB}$), Coulomb ($\alpha$), and resonance ($\beta$)
3. **Bonding is driven by resonance ($\beta < 0$)**, which allows electron delocalization
4. **The asymmetry** in energy shifts explains molecular stability patterns

---

## References for Deeper Understanding

- **Overlap Integral:** $S_{AB}(R) = e^{-R/a_0}\left(1 + \frac{R}{a_0} + \frac{R^2}{3a_0^2}\right)$
  - $S = 1$ at $R = 0$ (complete overlap)
  - $S \to 0$ as $R \to \infty$ (no overlap at large distance)

- **Resonance Integral:** $\beta = H_{AB}$ is negative at equilibrium bond distance, stabilizing bonding
- **Exact Solution:** H₂⁺ can be solved exactly in ellipsoidal coordinates, giving $R_e = 2.49\,a_0$ and $D_e = 2.79$ eV
