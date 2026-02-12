'use server';
/**
 * @fileOverview Adjusts the difficulty of the game based on player performance.
 *
 * - adjustDifficulty - A function that adjusts the game difficulty.
 * - AdjustDifficultyInput - The input type for the adjustDifficulty function.
 * - AdjustDifficultyOutput - The return type for the adjustDifficulty function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AdjustDifficultyInputSchema = z.object({
  playerSuccess: z.boolean().describe('Whether the player succeeded in the last challenge.'),
  currentDifficulty: z.number().describe('The current difficulty level (e.g., 1-10).'),
});
export type AdjustDifficultyInput = z.infer<typeof AdjustDifficultyInputSchema>;

const AdjustDifficultyOutputSchema = z.object({
  newDifficulty: z.number().describe('The new difficulty level, adjusted based on player success.'),
  reasoning: z.string().describe('Explanation of why the difficulty was adjusted.'),
});
export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdjustDifficultyInput): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {
    schema: z.object({
      playerSuccess: z.boolean().describe('Whether the player succeeded in the last challenge.'),
      currentDifficulty: z.number().describe('The current difficulty level (e.g., 1-10).'),
    }),
  },
  output: {
    schema: z.object({
      newDifficulty: z.number().describe('The new difficulty level, adjusted based on player success.'),
      reasoning: z.string().describe('Explanation of why the difficulty was adjusted.'),
    }),
  },
  prompt: `You are the dungeon master of a text based adventure game. The player has just completed a challenge, and your job is to adjust the difficulty of the game based on their performance.

Player Success: {{{playerSuccess}}}
Current Difficulty: {{{currentDifficulty}}}

Based on the player's success, adjust the difficulty of the game. If the player succeeded, increase the difficulty by a small amount, no more than 2 difficulty points at a time, unless the difficulty is already at the maximum of 10. If the player failed, decrease the difficulty by a small amount, no more than 2 difficulty points at a time, unless the difficulty is already at the minimum of 1. Explain your reasoning for the adjustment.
`,
});

const adjustDifficultyFlow = ai.defineFlow<
  typeof AdjustDifficultyInputSchema,
  typeof AdjustDifficultyOutputSchema
>(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdjustDifficultyInputSchema,
    outputSchema: AdjustDifficultyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
