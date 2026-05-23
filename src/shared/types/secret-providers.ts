import type { SecretProviderId } from '@/shared/types/ipc'

/** All secret providers — keep in sync with `SecretProviderId` in ipc.ts. */
export const SECRET_PROVIDER_IDS = [
  'openrouter',
  'custom-llm',
  'openai',
  'anthropic',
  'google',
  'groq',
  'azure-speech'
] as const satisfies readonly SecretProviderId[]
