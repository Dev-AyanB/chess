# PROJECT_REQUIREMENTS.md

# Modern Chess Web Application Specification

## 1. Project Overview

Build a production-quality, responsive chess web application with a clean modern interface. The application should be maintainable, modular, and suitable as a portfolio project.

---

## 2. Objectives

- Implement all official FIDE chess rules.
- Provide an intuitive modern UI.
- Support desktop and mobile.
- Maintain clean architecture.
- Prioritize readability and maintainability.

---

## 3. Scope

### Included

- Local two-player chess
- Legal move validation
- Check
- Checkmate
- Stalemate
- Castling
- En passant
- Pawn promotion
- Draw detection
- Move history
- Undo / Redo
- Restart game
- Flip board
- Light/Dark themes
- Responsive layout
- Sound effects (toggle)
- PGN export
- FEN import/export

### Excluded

- Multiplayer
- Authentication
- Accounts
- Backend
- Database
- Payments

---

## 4. Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- chess.js
- react-chessboard
- Lucide React
- Vitest
- React Testing Library
- ESLint
- Prettier
- pnpm

---

## 5. Folder Structure

```text
src/
  components/
  pages/
  hooks/
  lib/
  types/
  utils/
  assets/
  styles/
  App.tsx
```

---

## 6. UI Requirements

- Modern minimalist appearance.
- Rounded cards.
- Smooth animations.
- Responsive from 320px to 4K.
- Dark mode default.
- Accent color configurable.
- Board centered.
- Captured pieces shown.
- Move list visible.
- Current player indicator.

---

## 7. Functional Requirements

- chess.js is the single source of truth for game rules.
- No custom chess engine.
- Illegal moves impossible.
- Promotion dialog appears immediately.
- Game over dialog displays winner or draw reason.
- Undo restores previous position.
- Restart resets all state.

---

## 8. Performance

- Initial load under 2 seconds on modern broadband.
- Maintain 60 FPS during animations.
- Avoid unnecessary rerenders.

---

## 9. Accessibility

- Keyboard navigation.
- Visible focus states.
- Proper ARIA labels.
- Sufficient color contrast.

---

## 10. Coding Standards

- TypeScript only.
- Strict mode enabled.
- Functional React components only.
- No inline CSS.
- Reusable components.
- Clear naming.
- Zero ESLint errors.
- Zero TypeScript errors.

---

## 11. Constraints

- No backend.
- No database.
- No authentication.
- No duplicated business logic.
- Components should remain reasonably small.
- Avoid global mutable state unless justified.

---

## 12. Testing

Minimum coverage:

- Game logic
- Promotion
- Castling
- En passant
- Checkmate
- Undo
- PGN/FEN handling

---

## 13. Documentation Rules

This document is the project's single source of truth.

If implementation conflicts with this specification,
this document takes precedence until intentionally updated.

Do not invent features.

If requirements are ambiguous,
STOP and ask before implementing.

Whenever functionality changes,
update this document in the same commit.

---

## 14. Definition of Done

A feature is complete only if:

- Builds successfully
- Tests pass
- ESLint passes
- TypeScript passes
- Responsive layout verified
- Documentation updated (if requirements changed)

---

## 15. Initial Prompt for AI Coding Agents

Read this entire document before writing any code.

Treat this file as the project's authoritative specification.

Do not make assumptions outside this document.

Before coding:
1. Summarize the project.
2. Produce an implementation plan.
3. Wait for approval.

During implementation:
- Keep code modular.
- Follow the specified tech stack.
- Verify every feature against this document.

After implementation:
- Run tests.
- Fix all lint/type errors.
- Confirm all requirements have been satisfied.
