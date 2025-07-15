# Project Structure

This document outlines the organization of the Podcast application's codebase.

## Root Directory

```
.
├── .github/              # GitHub configurations
│   ├── workflows/       # GitHub Actions workflows
│   └── ISSUE_TEMPLATE/  # GitHub issue templates
├── config/              # Configuration files
├── docs/                # Documentation
│   ├── architecture/    # Architecture decisions and diagrams
│   └── api/             # API documentation
├── public/              # Publicly accessible files
│   ├── assets/          # Static assets
│   │   ├── images/      # Image files
│   │   └── fonts/       # Font files
│   └── locales/         # Localization files
├── scripts/             # Utility scripts
│   ├── dev/            # Development scripts
│   └── deploy/         # Deployment scripts
├── src/                 # Source code
│   ├── components/     # Reusable React components
│   │   ├── common/     # Shared components
│   │   ├── layout/     # Layout components
│   │   ├── pages/      # Page components
│   │   └── ui/         # UI primitives
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and business logic
│   ├── styles/         # Global styles and themes
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── tests/              # Test files
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
└── uploads/            # User-uploaded files
```

## Key Directories

### `src/components/`
- **common/**: Shared components used across multiple pages
- **layout/**: Layout components (headers, footers, sidebars)
- **pages/**: Page-level components (one per route)
- **ui/**: Reusable UI primitives (buttons, inputs, etc.)

### `src/services/`
- API clients
- State management
- Business logic
- Third-party service integrations

### `public/assets/`
- Static assets that don't require processing
- Images, fonts, and other media files

## Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.js`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useWindowSize.js`)
- **Utils**: camelCase (e.g., `formatDate.js`)
- **Test files**: `*.test.js` or `*.spec.js`
- **Configuration**: kebab-case (e.g., `app-config.js`)
