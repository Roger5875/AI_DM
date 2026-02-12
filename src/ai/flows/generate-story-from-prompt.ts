'use server';
/**
 * @fileOverview A story generation AI agent.
 *
 * - generateStoryFromPrompt - A function that handles the story generation process.
 * - GenerateStoryFromPromptInput - The input type for the generateStoryFromPrompt function.
 * - GenerateStoryFromPromptOutput - The return type for the generateStoryFromPrompt function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateStoryFromPromptInputSchema = z.object({
  prompt: z.string().describe('The high-level prompt for the story (e.g., "fantasy adventure with dragons").'),
  settingPreferences: z.string().optional().describe('Player preferences for the game setting.'),
  characterPreferences: z.string().optional().describe('Player preferences for characters.'),
  plotPreferences: z.string().optional().describe('Player preferences for the plot.'),
});
export type GenerateStoryFromPromptInput = z.infer<typeof GenerateStoryFromPromptInputSchema>;

const GenerateStoryFromPromptOutputSchema = z.object({
  story: z.string().describe('The generated story, world, and character setup.'),
  progress: z.string().describe('A one-sentence summary of the generated story.'),
});
export type GenerateStoryFromPromptOutput = z.infer<typeof GenerateStoryFromPromptOutputSchema>;

export async function generateStoryFromPrompt(input: GenerateStoryFromPromptInput): Promise<GenerateStoryFromPromptOutput> {
  return generateStoryFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryFromPromptPrompt',
  input: {
    schema: z.object({
      prompt: z.string().describe('The high-level prompt for the story.'),
      settingPreferences: z.string().optional().describe('Player preferences for the game setting.'),
      characterPreferences: z.string().optional().describe('Player preferences for characters.'),
      plotPreferences: z.string().optional().describe('Player preferences for the plot.'),
    }),
  },
  output: {
    schema: z.object({
      story: z.string().describe('The generated story, world, and character setup.'),
      progress: z.string().describe('A one-sentence summary of the generated story.'),
    }),
  },
  prompt: `You are a dynamic Dungeon Master, creating worlds, challenges, characters, and quests in real-time based on the player's input.

  First, ask a few questions about what kind of game the player wants to play. Specifically, ask about the following in a conversational manner:

  1. Setting: What kind of setting does the player prefer? (e.g., fantasy, sci-fi, modern)
  2. Characters: What kind of characters does the player want to see? (e.g., heroic, villainous, comedic)
  3. Plot: What kind of plot does the player want to experience? (e.g., adventure, mystery, romance)

  Based on the high-level prompt, and the player's answers to the above questions, generate an initial story, world, and character setup so the player can quickly start playing without needing to define everything from scratch. Limit the story to a maximum of 2 paragraphs.

  Prompt: {{{prompt}}}
  Setting Preferences: {{{settingPreferences}}}
  Character Preferences: {{{characterPreferences}}}
  Plot Preferences: {{{plotPreferences}}}

  Also, add one short, one-sentence summary of what you have generated to the 'progress' field.
  `,
});

const generateStoryFromPromptFlow = ai.defineFlow<
  typeof GenerateStoryFromPromptInputSchema,
  typeof GenerateStoryFromPromptOutputSchema
>({
  name: 'generateStoryFromPromptFlow',
  inputSchema: GenerateStoryFromPromptInputSchema,
  outputSchema: GenerateStoryFromPromptOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
