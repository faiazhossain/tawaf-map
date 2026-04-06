# Contributing to TawafMap

Thank you for your interest in contributing to TawafafMap. This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Commit Convention](#commit-convention)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

---

## Development Setup

### Prerequisites

- Node.js 20+ installed
- pnpm (recommended) or npm/yarn
- Git

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd tawaf-map

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up git hooks
pnpm prepare

# Start development server
pnpm dev
```

---

## Code Standards

### TypeScript

- Use TypeScript for all new files
- Avoid `any` types
- Define interfaces for component props and API responses
- Use strict mode in `tsconfig.json`

### React/Next.js

- Use functional components with hooks
- Follow the existing component structure
- Use `const` for component declarations
- Prefer explicit prop types over implicit any

### Styling

- Use Tailwind CSS utility classes
- Follow the existing naming conventions
- Use shadcn/ui components when possible
- Keep styles co-located with components

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MapView.tsx` |
| Hooks | camelCase with 'use' prefix | `useGeolocation.ts` |
| Utilities | camelCase | `distance.ts` |
| Types | camelCase | `map.ts` |
| Constants | SCREAMING_SNAKE_CASE | `API_ENDPOINTS.ts` |

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance tasks |
| `docs` | Documentation changes |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `perf` | Performance improvements |

### Examples

```bash
feat(map): add gate marker clustering
fix(api): handle rate limit errors gracefully
chore(deps): upgrade maplibre-gl to v4.0.0
docs(readme): update setup instructions
refactor(store): extract common state logic
test(components): add MapView unit tests
```

### Commitlint

This project uses commitlint to enforce commit message conventions. Commits that don't follow the format will be rejected.

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode
pnpm test:e2e:headed

# Run E2E tests for specific file
pnpm test:e2e tests/map.spec.ts
```

### Testing Guidelines

- Write tests for new features
- Maintain test coverage above 80%
- Test edge cases and error states
- Use descriptive test names
- Mock external API calls

---

## Pre-Commit Hooks

This project uses Husky and lint-staged to run checks before commits:

```bash
# .husky/pre-commit
pnpm lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

## Pull Request Process

### 1. Branch Naming

Use descriptive branch names following this pattern:

```
<type>/<short-description>
```

Examples:
- `feature/gate-navigation`
- `fix/location-tracking`
- `refactor/store-architecture`

### 2. Before Submitting

- [ ] Run tests: `pnpm test` and `pnpm test:e2e`
- [ ] Run linter: `pnpm lint`
- [ ] Run type check: `pnpm type-check`
- [ ] Update documentation if needed
- [ ] Add tests for new functionality

### 3. PR Description Template

```markdown
## Summary
<!-- Brief description of changes -->

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Tests

## Changes
- List of main changes

## Testing
- Describe how you tested these changes
- Link to test coverage if applicable

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Checklist
- [ ] Code follows project standards
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors/warnings
```

### 4. Review Process

- At least one approval required
- All CI checks must pass
- Address review feedback promptly
- Keep PRs focused and atomic

---

## Code Review Guidelines

### For Reviewers

- Be constructive and specific
- Explain the reasoning for suggestions
- Approve if changes are good enough (not perfect)
- Respond to reviews within 24 hours

### For Authors

- Provide context in PR description
- Respond to all comments
- Mark conversations as resolved when addressed
- Keep commits clean (use fixup commits if needed)

---

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for architectural questions
- Contact maintainers for urgent matters
