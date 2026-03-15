/**
 * Client Anthropic pour l'API Claude (usage serveur uniquement)
 */
import Anthropic from '@anthropic-ai/sdk';

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant');
  return new Anthropic({ apiKey });
}

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
