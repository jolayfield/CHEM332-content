import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';

const weeksContainer = document.getElementById('weeks-container');

// Since we can't easily crawl directories on the client side without a server-side API or build-time script,
// we'll manually define the weeks for now. In a more robust setup, this would be generated.
const weeks = Array.from({ length: 14 }, (_, i) => i + 1);

if (weeksContainer) {
    weeksContainer.innerHTML = weeks.map(weekNum => {
        const weekFormatted = weekNum.toString().padStart(2, '0');
        // Sequential lecture numbers: Week 1 (1-3), Week 2 (4-6), etc.
        const startLec = (weekNum - 1) * 3 + 1;
        const lectureNums = [startLec, startLec + 1, startLec + 2];

        return `
            <div class="glass-panel feature-card">
              <h3>Week ${weekNum}</h3>
              <p>Notes and materials for week ${weekNum} of CHEM 332.</p>
              
              <div class="lecture-links-group" style="margin-top: 1rem;">
                <div style="font-weight: bold; margin-bottom: 0.5rem; color: var(--st-thomas-purple);">Lecture Notes</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <a href="lecture-view.html?week=${weekFormatted}&lecture=README" class="text-link" style="font-size: 0.85em;">Overview</a>
                  ${lectureNums.map(lecNum => {
            const lecFormatted = lecNum.toString().padStart(2, '0');
            return `<a href="lecture-view.html?week=${weekFormatted}&lecture=Lecture_${lecFormatted}" class="text-link" style="font-size: 0.85em;">L${lecNum}</a>`;
        }).join('')}
                </div>
              </div>
            </div>
        `;
    }).join('');

    // Add hover effects (reuse landing logic)
    const cards = weeksContainer.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            (card as HTMLElement).style.transform = 'translateY(-5px)';
            (card as HTMLElement).style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
            (card as HTMLElement).style.transform = 'translateY(0)';
            (card as HTMLElement).style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.05)';
        });
    });
}

/**
 * Setup theme toggle button click handler
 */
function setupThemeToggle(): void {
  const themeToggleBtn = document.querySelector('.theme-toggle') as HTMLElement;
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      toggleTheme();
    });
  }
}

// Initialize theme and theme toggle
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupThemeToggle();
});
