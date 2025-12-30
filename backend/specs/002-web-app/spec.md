# Feature Specification: 002-web-app

**Feature ID:** 002-web-app
**Status:** In Progress
**Created:** 2025-12-30

## Overview
Full-stack web application for todo management with user authentication.

## Goals
- Provide web UI for todo CRUD operations
- Implement secure user authentication via Better Auth
- Support multi-user access with data isolation

## Scope
### In Scope
- Next.js frontend + Better Auth
- FastAPI backend + JWT verification
- User registration and login flows
- CRUD operations on todos

### Out of Scope
- Email verification
- Password reset (Phase III)
- Social auth providers

## User Stories
- US-001: Register with name, email, password
- US-002: Login with email and password
- US-003: Create todos (authenticated)
- US-004: View my todos
- US-005: Mark todos complete
- US-006: Edit todos
- US-007: Delete todos
- US-008: Todo privacy (user isolation)

## Acceptance Criteria
- [x] User can register and login
- [x] Authenticated CRUD operations work
- [x] Unauthenticated users redirected
- [x] Todos isolated per user
- [x] Session persists across refreshes
- [x] Backend verifies JWT tokens
