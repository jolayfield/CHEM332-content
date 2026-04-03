import { Marked } from 'marked';
import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';

const contentContainer = document.getElementById('lecture-content');
const urlParams = new URLSearchParams(window.location.search);
const week = urlParams.get('week');
const lecture = urlParams.get('lecture');

async function loadLecture() {
    if (!contentContainer) return;

    if (!week || !lecture) {
        contentContainer.innerHTML = '<p>Error: Missing week or lecture parameter.</p>';
        return;
    }

    try {
        const response = await fetch(`./lectures/Week_${week}/${lecture}.md`);
        if (!response.ok) {
            throw new Error(`Failed to load lecture: ${response.statusText}`);
        }

        const markdown = await response.text();
        const marked = new Marked();
        contentContainer.innerHTML = await marked.parse(markdown);

        // Render math equations
        // @ts-ignore - KaTeX extension export
        import('katex/dist/contrib/auto-render.mjs').then((module) => {
            const renderMathInElement = module.default;
            renderMathInElement(contentContainer, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        });

        // Update page title
        document.title = `${lecture.replace('_', ' ')} - Week ${week} - QuantumChem`;

    } catch (error) {
        console.error('Error loading lecture:', error);
        contentContainer.innerHTML = `<p>Error loading lecture material. Please ensure the file exists at <code>./lectures/Week_${week}/${lecture}.md</code>.</p>`;
    }
}

loadLecture();
