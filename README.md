# MediHub Landing Page

A modern, clean, and professional landing page for MediHub - A Health Record System. Built with React 18, Vite, and TailwindCSS.

## Features

- **Minimal Design**: Clean, healthcare-themed design with light colors and soft blue/green accents
- **Responsive Layout**: Mobile-friendly design that works on all devices
- **Modern React**: Built with functional components and React hooks
- **TailwindCSS**: Utility-first CSS framework for rapid development
- **Professional UI**: Healthcare-focused design with trust and simplicity in mind
- **Role Selection**: Interactive role-based navigation system
- **Multi-Page Flow**: Seamless navigation between landing page, role selection, and dashboards

## Tech Stack

- **React 18** - Latest React framework with hooks
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MediHub
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/              # React components
│   ├── Navbar.jsx          # Navigation bar with login button
│   ├── Hero.jsx            # Hero section
│   ├── Features.jsx        # Features section
│   ├── Footer.jsx          # Footer
│   ├── RoleSelection.jsx   # Role selection page
│   └── RoleDashboard.jsx   # Role-specific dashboard
├── App.jsx                 # Main app component with routing
├── main.jsx                # Entry point
└── index.css               # Global styles and TailwindCSS
```

## User Flow

1. **Landing Page**: Users see the main MediHub introduction
2. **Login/Register**: Clicking the button takes users to role selection
3. **Role Selection**: Users choose from 4 roles:
   - Patient: Access and manage health records
   - Doctor: View and manage patient records
   - Hospital: Manage hospital operations
   - Labs: Manage laboratory tests and results
4. **Dashboard**: Role-specific dashboard with relevant features
5. **Navigation**: Users can go back to role selection or return home

## Customization

### Colors
The color scheme can be customized in `tailwind.config.js`:
- Primary colors: Blue tones for main elements
- Secondary colors: Green tones for accents
- Gray scale: Neutral colors for text and backgrounds

### Content
Update the content in each component file:
- `Navbar.jsx` - Company name and navigation
- `Hero.jsx` - Main headline and description
- `Features.jsx` - Feature descriptions and icons
- `RoleSelection.jsx` - Role options and descriptions
- `RoleDashboard.jsx` - Dashboard content for each role
- `Footer.jsx` - Copyright information

### Adding New Roles
To add new roles, update the `roles` array in `RoleSelection.jsx` and add corresponding case in `RoleDashboard.jsx`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ for better healthcare management
