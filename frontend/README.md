# GitHub Tune Frontend

A SvelteKit application that transforms GitHub contribution graphs into musical melodies. This application allows users to enter their GitHub username, visualize their contribution history, and listen to a musical representation of their coding activity.

## Overview

The GitHub Tune frontend is built with modern web technologies:

- **Framework**: [SvelteKit](https://kit.svelte.dev/) (v2.16+)
- **UI**: Custom-designed responsive components with dark/light theme support
- **Audio**: Browser-based synthesis using [Tone.js](https://tonejs.github.io/)
- **Icons**: [Lucide](https://lucide.dev/) icon set
- **Styling**: [TailwindCSS](https://tailwindcss.com/) (v4.0+)

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ContributionGraph.svelte    # GitHub-style contribution visualization
│   ├── PlaybackControls.svelte     # Audio playback interface
│   ├── Tip.svelte                  # User guidance tooltips
│   └── TipManager.svelte           # Manages tooltip display logic
├── config/             # Type definitions and configurations
│   └── types.ts                    # TypeScript interfaces/types
├── lib/                # Shared utilities
│   ├── audio-engine.ts             # Tone.js audio generation engine
│   ├── error-handling.ts           # Error handling utilities
│   ├── harmonies.ts                # Musical scale and harmony definitions
│   └── index.ts                    # Re-exports of library utilities
├── routes/             # SvelteKit routes
│   ├── +layout.svelte             # App layout template
│   └── +page.svelte               # Main application page
└── app.html            # HTML template
```

## Features

- **GitHub Contribution Visualization**: Interactive graph showing contribution activity
- **Contribution Audio Generation**: Transforms activity levels into musical notes
- **Playback Controls**: Adjust speed, musical scale, and harmony settings
- **Dark/Light Theme**: Toggle between visual themes
- **Responsive Design**: Adapts to mobile, tablet, and desktop viewports
- **Year Selection**: View and play contribution patterns from different years

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) package manager

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server with hot reload
pnpm run dev

# Start with network access for testing on other devices
pnpm run dev -- --host

# Start and open in browser
pnpm run dev -- --open
```

### Building for Production

```bash
# Create optimized production build
pnpm run build

# Preview production build locally
pnpm run preview
```

### Linting and Formatting

```bash
# Check code formatting
pnpm run lint

# Format code with Prettier
pnpm run format
```

## Architecture

### Audio Generation

The application uses the following process to generate music from contribution data:

1. **Data Fetching**: GitHub contributions are retrieved via the backend API
2. **Note Mapping**: Contribution levels (0-4) are mapped to musical notes
3. **Playback**: Notes are played sequentially using Tone.js synthesizer
4. **Harmony**: Optional harmonies can enhance the melody with complementary notes

### State Management

The application uses Svelte's reactive state management to handle:

- User input state
- Contribution data
- Playback controls
- Visual theme preferences
- Audio engine state

## API Integration

The frontend interacts with the AWS Lambda backend through CloudFront:

```typescript
// Example API call to fetch GitHub contributions
async function fetchContributions() {
  const response = await fetch(`${apiUrl}/${username}`);
  const data = await response.json();
  // Process contribution data
}
```

## Browser Compatibility

The application is tested and optimized for:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

Mobile browsers are fully supported with a responsive design.

## Contributing

When contributing to the frontend codebase, please follow these guidelines:

1. Follow the existing code style and organization
2. Maintain TypeScript type safety throughout
3. Keep components small and focused on a single responsibility
4. Use reactive patterns for state management
5. Test changes across different screen sizes

## Troubleshooting

### Audio Issues

If audio doesn't play properly:

- Ensure browser permissions allow audio playback
- Check browser console for Tone.js error messages
- Try a different browser if issues persist

### Build Problems

If you encounter build issues:

```bash
# Clean the SvelteKit build cache
rm -rf .svelte-kit/

# Reinstall dependencies
pnpm install
```
