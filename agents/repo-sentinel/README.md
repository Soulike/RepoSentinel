# RepoSentinel

RepoSentinel is an AI agent that monitors Git repositories and generates detailed reports on code changes.

## Setup

1. Install dependencies:

```bash
bun install
```

2. Copy `.env.example` to `.env` and configure the environment variables.

3. Build and run:

```bash
bun run build
bun start
```

The agent runs immediately on startup and then periodically based on your configuration. Reports are saved to the configured report directory.
