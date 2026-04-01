#!/usr/bin/env python3

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime

# Create PDF
pdf_path = "QuantumChem_Project_Overview.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                        rightMargin=0.75*inch,
                        leftMargin=0.75*inch,
                        topMargin=0.75*inch,
                        bottomMargin=0.75*inch)

# Define styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=28,
    textColor=colors.HexColor('#1a1a2e'),
    spaceAfter=6,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading1_style = ParagraphStyle(
    'CustomHeading1',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=colors.HexColor('#0f3460'),
    spaceAfter=12,
    spaceBefore=12,
    fontName='Helvetica-Bold'
)

heading2_style = ParagraphStyle(
    'CustomHeading2',
    parent=styles['Heading2'],
    fontSize=12,
    textColor=colors.HexColor('#0f3460'),
    spaceAfter=8,
    spaceBefore=8,
    fontName='Helvetica-Bold'
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=8
)

bullet_style = ParagraphStyle(
    'BulletStyle',
    parent=styles['Normal'],
    fontSize=10,
    leftIndent=20,
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    'CustomSubtitle',
    parent=styles['Normal'],
    fontSize=14,
    textColor=colors.HexColor('#0f3460'),
    alignment=TA_CENTER,
    spaceAfter=12
)

# Story for the PDF content
story = []

# Title Page
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph("QuantumChem", title_style))
story.append(Paragraph("Interactive Learning Platform", subtitle_style))
story.append(Spacer(1, 0.3*inch))
story.append(Paragraph("Quantum Mechanics Simulations & Educational Tools", normal_style))
story.append(Spacer(1, 0.3*inch))
story.append(Paragraph(f"<b>University of St. Thomas</b>", normal_style))
story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y')}", normal_style))
story.append(PageBreak())

# Table of Contents
story.append(Paragraph("Table of Contents", heading1_style))
story.append(Paragraph("1. Project Overview", bullet_style))
story.append(Paragraph("2. Technologies Used", bullet_style))
story.append(Paragraph("3. Key Features & Modules", bullet_style))
story.append(Paragraph("4. Project Architecture", bullet_style))
story.append(Paragraph("5. Development History", bullet_style))
story.append(Spacer(1, 0.2*inch))
story.append(PageBreak())

# Project Overview
story.append(Paragraph("1. Project Overview", heading1_style))
story.append(Paragraph(
    "QuantumChem is an interactive web-based educational platform designed to help students "
    "and educators explore fundamental concepts in quantum mechanics and chemistry. Hosted by the "
    "University of St. Thomas, the platform provides a collection of physics simulations and "
    "visualizations that bring theoretical concepts to life through interactive experimentation.",
    normal_style
))
story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("Project Goals:", heading2_style))
story.append(Paragraph(
    "• Provide interactive, web-based tools for learning quantum mechanics<br/>"
    "• Visualize complex physical phenomena in an accessible way<br/>"
    "• Integrate lecture materials with hands-on simulation experiences<br/>"
    "• Enable students to experiment with parameters and observe real-time effects",
    normal_style
))
story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("Target Audience:", heading2_style))
story.append(Paragraph(
    "Physics and chemistry students at the undergraduate and graduate levels, as well as "
    "educators seeking interactive teaching materials for quantum mechanics courses.",
    normal_style
))
story.append(Spacer(1, 0.2*inch))

# Technologies Used
story.append(PageBreak())
story.append(Paragraph("2. Technologies Used", heading1_style))

tech_data = [
    ['Technology', 'Version', 'Purpose'],
    ['TypeScript', '5.9.3', 'Primary programming language for type-safe development'],
    ['Vite', '7.2.4', 'Fast build tool and development server'],
    ['Three.js', '0.182.0', '3D visualization library for atomic orbitals and molecular graphics'],
    ['Chart.js', '4.5.1', '2D plotting and graphing for energy diagrams and data visualization'],
    ['KaTeX', '0.16.28', 'Mathematical formula rendering and typesetting'],
    ['Marked', '17.0.2', 'Markdown parser for lecture content conversion'],
    ['Node.js', 'Latest', 'Runtime environment and package management'],
]

tech_table = Table(tech_data, colWidths=[1.5*inch, 0.8*inch, 2.7*inch])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f3460')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
]))
story.append(tech_table)
story.append(Spacer(1, 0.2*inch))

story.append(Paragraph("Build & Deployment:", heading2_style))
story.append(Paragraph(
    "• <b>Development Server:</b> Vite provides hot module replacement (HMR) for rapid development<br/>"
    "• <b>Production Build:</b> Optimized bundle generation via Vite<br/>"
    "• <b>Deployment:</b> GitHub Pages for static hosting and distribution<br/>"
    "• <b>Package Manager:</b> npm for dependency management",
    normal_style
))
story.append(Spacer(1, 0.2*inch))

# Key Features & Modules
story.append(PageBreak())
story.append(Paragraph("3. Key Features & Modules", heading1_style))

features = [
    {
        "name": "Photoelectric Effect Simulator",
        "desc": "Interactive demonstration of the photoelectric effect allowing students to adjust light frequency and intensity, observe electron ejection, and explore the relationship between photon energy and work functions across different metals."
    },
    {
        "name": "Bohr Model Visualization",
        "desc": "Visualizes electron orbits, energy level transitions, and spectral line emissions. Features an energy diagram with transitions and interactive controls for exploring hydrogen-like atoms."
    },
    {
        "name": "Particle in a Box (1D & 2D)",
        "desc": "Quantum wave function simulations showing energy quantization in infinite potential wells. 1D version shows wave patterns; 2D version includes contour plot visualization with superposition states and animation controls."
    },
    {
        "name": "Quantum Tunneling & Barrier Scattering",
        "desc": "Demonstrates particle scattering through finite potential barriers with visualization of reflection, transmission, and tunneling phenomena. Real-time animation of particle trajectories."
    },
    {
        "name": "3D Atomic Orbitals",
        "desc": "Interactive 3D probability density visualizations for hydrogen-like atoms using Three.js. Supports different quantum numbers (n, l, m<sub>l</sub>) with real-time rendering."
    },
    {
        "name": "Diatomic Molecular Orbital (MO) Schemes",
        "desc": "Tools for building and visualizing molecular orbital diagrams for diatomic molecules. Interactive diagram editor for determining bond properties and orbital interactions."
    },
    {
        "name": "Integrated Lecture Materials",
        "desc": "Repository of course lectures organized by week with PDF and Markdown formats. Supports mathematical notation via KaTeX for seamless integration with simulations."
    },
]

for feature in features:
    story.append(Paragraph(feature["name"], heading2_style))
    story.append(Paragraph(feature["desc"], normal_style))
    story.append(Spacer(1, 0.1*inch))

story.append(Spacer(1, 0.15*inch))

# Project Architecture
story.append(PageBreak())
story.append(Paragraph("4. Project Architecture", heading1_style))

story.append(Paragraph("Module Organization:", heading2_style))
story.append(Paragraph(
    "The project is organized into simulation modules, each with dedicated TypeScript files "
    "for logic and HTML entry points for UI. This modular design enables independent feature "
    "development and easy addition of new simulations.",
    normal_style
))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("Core Simulation Modules:", heading2_style))
arch_modules = [
    "• <b>photoelectric.ts / photoelectric.html</b> - Photoelectric effect with graph.ts for visualization",
    "• <b>bohr.ts / bohrSimulation.ts</b> - Bohr model with energyDiagram.ts for level diagrams",
    "• <b>particleBox*.ts / particleBox*.html</b> - 1D and 2D quantum well simulations",
    "• <b>barrier.ts / barrierSimulation.ts</b> - Quantum tunneling and scattering",
    "• <b>atomic-orbitals.ts</b> - 3D orbital visualization with Three.js and orbitals-math.ts",
    "• <b>mo-scheme.ts / mo-diagram.ts</b> - Molecular orbital diagram creation and rendering",
]
story.append(Paragraph("<br/>".join(arch_modules), normal_style))
story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("Shared Infrastructure:", heading2_style))
story.append(Paragraph(
    "• <b>graph.ts:</b> 2D graphing utilities using Chart.js<br/>"
    "• <b>energyDiagram.ts:</b> Energy level diagram rendering<br/>"
    "• <b>orbitals-math.ts:</b> Mathematical functions for hydrogen orbitals<br/>"
    "• <b>mo-diagram.ts:</b> Molecular orbital diagram logic<br/>"
    "• <b>landing.ts:</b> Interactive landing page with feature cards<br/>"
    "• <b>lectures.ts / lecture-view.ts:</b> Lecture content management and display",
    normal_style
))
story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("Styling & UX:", heading2_style))
story.append(Paragraph(
    "The platform uses a modern glass-morphism design with CSS animations and responsive layouts. "
    "The University of St. Thomas branding is integrated throughout with consistent typography "
    "(Merriweather font) and color schemes.",
    normal_style
))
story.append(Spacer(1, 0.2*inch))

# Development History
story.append(PageBreak())
story.append(Paragraph("5. Development History", heading1_style))

story.append(Paragraph(
    "The QuantumChem project has evolved significantly since its inception, growing from a basic "
    "photoelectric effect simulator into a comprehensive educational platform with multiple advanced simulations.",
    normal_style
))
story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("Key Development Milestones:", heading2_style))

milestones = [
    {
        "phase": "Phase 1: Foundation (Early Development)",
        "items": [
            "Initial implementation of photoelectric effect simulation",
            "Graph visualization system using Chart.js",
            "Basic UI framework and landing page",
            "Setup of TypeScript and Vite build system"
        ]
    },
    {
        "phase": "Phase 2: Core Simulations (Bohr & Particle in a Box)",
        "items": [
            "Bohr model visualization with energy level diagrams",
            "1D particle in a box quantum wave simulation",
            "Implementation of animation controls and parameter sliders",
            "Performance optimizations and code splitting"
        ]
    },
    {
        "phase": "Phase 3: Advanced Features (Tunneling & Orbitals)",
        "items": [
            "Quantum tunneling through finite barriers",
            "3D atomic orbital visualization with Three.js",
            "Integration of course lectures (Weeks 1-7+)",
            "Mathematical rendering with KaTeX"
        ]
    },
    {
        "phase": "Phase 4: Extended Simulations (2D & Molecular Orbitals)",
        "items": [
            "2D particle in a box with contour plot visualization",
            "Diatomic molecular orbital scheme builder",
            "Superposition state controls for particle in a box",
            "Enhanced diagram rendering and interaction"
        ]
    },
    {
        "phase": "Phase 5: Refinement & Polish (Current)",
        "items": [
            "University of St. Thomas branding integration",
            "Improved Bohr energy diagram visibility",
            "Unified particle in a box card UI",
            "Responsive design and mobile optimization"
        ]
    },
]

for milestone in milestones:
    story.append(Paragraph(milestone["phase"], heading2_style))
    for item in milestone["items"]:
        story.append(Paragraph(f"• {item}", bullet_style))
    story.append(Spacer(1, 0.08*inch))

story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("Recent Commits (Latest 10):", heading2_style))
commits = [
    "Updates",
    "Improve Bohr energy diagram visibility with sqrt spacing and bolder rendering",
    "Updates",
    "Merge PIB cards into one with 1D and 2D links",
    "Updates",
    "Add 2D Particle in a Box simulation with contour plot visualization",
    "Updates",
    "Add Diatomic MO Scheme simulation with diagram module",
    "Updates",
    "Integrate course lectures and 3D atomic orbitals simulation",
]

for i, commit in enumerate(commits[:8], 1):
    story.append(Paragraph(f"• {commit}", bullet_style))

story.append(Spacer(1, 0.3*inch))

# Footer
story.append(Paragraph(
    "For more information, visit the University of St. Thomas Physics Department website.",
    normal_style
))
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph(
    "QuantumChem Project | © 2026 University of St. Thomas",
    normal_style
))

# Build the PDF
doc.build(story)
print(f"PDF created successfully: {pdf_path}")
