# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Bun monorepo for AI agents and supporting libraries. All packages use ESM and TypeScript.

### Workspace Structure

- **agents/** - AI agent applications
- **configs/** - Shared TypeScript and ESLint configurations
- **libraries/** - Reusable libraries (logging, OpenAI session management)
- **tools/** - OpenAI function calling tool definitions

### Package Naming Conventions

- `@agents/*` - Agent applications
- `@configs/*` - Configuration packages
- `@helpers/*` - Utility libraries
- `@ai/*` - AI/LLM integration libraries
- `@openai-tools/*` - OpenAI function calling tools

### Configuration Inheritance

Packages extend shared configs from `@configs/typescript` and `@configs/eslint`.

## Code Style

- Commit messages follow Conventional Commits
