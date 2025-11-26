# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tool Definition Pattern

Each tool module exports:

- `definition` - OpenAI `ChatCompletionFunctionTool` schema
- `handler` - `ToolFunction<Params>` implementation from `@ai/openai-session`

The package index exports an `allTools` array for bulk registration with `ToolRegistry`.
