# Contributing to Podcast Client

Thank you for your interest in contributing to the Podcast Client! We appreciate your time and effort in helping us improve this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Commit Message Guidelines](#commit-message-guidelines)
  - [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [License](#license)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 16.14.0 or higher
- npm 8.0.0 or higher
- Git

### Installation

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/podcast-client.git
   cd podcast-client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on the `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Start the development server:
   ```bash
   npm start
   ```

## Development Workflow

### Branching Strategy

We use the following branch naming conventions:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features being developed
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(auth): add login functionality

Add JWT-based authentication with login form and protected routes.

Closes #123
```

### Pull Request Process

1. Create a new branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name develop
   ```
2. Make your changes and commit them following the commit message guidelines
3. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request against the `develop` branch
5. Ensure all tests pass and there are no linting errors
6. Request a review from at least one maintainer
7. Address any review feedback
8. Once approved, your PR will be squashed and merged

## Code Style

We use ESLint and Prettier to maintain code quality and consistency. Run these commands before committing:

```bash
# Lint the code
npm run lint

# Format the code
npm run format

# Check for TypeScript errors (if applicable)
npm run type-check
```

## Testing

Write tests for new features and bug fixes. Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run coverage report
npm test -- --coverage
```

## Documentation

Update documentation when adding new features or changing existing behavior. Documentation includes:

- README.md
- API documentation (if applicable)
- Inline code comments
- CHANGELOG.md (for user-facing changes)

## Reporting Issues

When creating an issue, please include:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected vs. actual behavior
4. Browser/OS version if relevant
5. Screenshots if applicable

## Feature Requests

We welcome feature requests! Please:

1. Check if a similar feature already exists
2. Explain why this feature would be valuable
3. Include any relevant use cases or examples

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
