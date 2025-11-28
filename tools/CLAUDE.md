# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tool Definition Pattern

Each tool module exports a single named export implementing the `OpenAITool<T>` interface from `@ai/openai-session`:

```typescript
import type {OpenAITool} from '@ai/openai-session';

export interface MyToolParams {
  param1: string;
}

export const myTool: OpenAITool<MyToolParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'my_tool',
      description: 'Tool description',
      parameters: { ... },
    },
  },
  handler: async (args) => {
    // Implementation
    return 'result';
  },
};
```

The package index exports an `allTools` array for bulk registration with `ToolRegistry.registerAll()`.
