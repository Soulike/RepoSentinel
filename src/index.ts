import 'dotenv/config';
import * as readline from 'readline';
import {Session} from './ai/session.js';

const SYSTEM_PROMPT = `You are a helpful assistant. Be concise and friendly.`;

async function main(): Promise<void> {
  const session = new Session({
    systemPrompt: SYSTEM_PROMPT,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('RepoSentinel Chat Bot');
  console.log(
    'Type your message and press Enter. Type "exit" or "quit" to end.\n',
  );

  const prompt = (): void => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (
        trimmed.toLowerCase() === 'exit' ||
        trimmed.toLowerCase() === 'quit'
      ) {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      try {
        const response = await session.chat(trimmed);
        const content =
          response.choices[0]?.message?.content ?? '(no response)';
        console.log(`\nAssistant: ${content}\n`);
      } catch (error) {
        console.error(
          '\nError:',
          error instanceof Error ? error.message : error,
          '\n',
        );
      }

      prompt();
    });
  };

  prompt();
}

main();
