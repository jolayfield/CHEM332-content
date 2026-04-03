/**
 * Mobile Menu Toggle
 * Handles the responsive navigation menu on mobile devices
 */

export function setupMobileMenu(): void {
  const navToggle = document.querySelector('.nav-toggle') as HTMLElement;
  const navLinks = document.querySelector('.nav-links') as HTMLElement;

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  // Close menu when a link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.nav-links') && !target.closest('.nav-toggle')) {
      navLinks.classList.remove('active');
    }
  });
}
