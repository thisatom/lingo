import type { ChatComposerMode } from '@/entities/settings/model/store'

export function resolveComposerPlaceholder(options: {
  llmReady: boolean
  blockedReason: string | null
  chatComposerMode: ChatComposerMode
  liveConversationActive: boolean
  isListening: boolean
  hasAttachments: boolean
  agentBusy: boolean
}): string {
  if (!options.llmReady) {
    return options.blockedReason ?? 'Add API key in Settings…'
  }

  if (options.hasAttachments) {
    return 'Ask about the image…'
  }

  if (options.chatComposerMode === 'conversation') {
    if (options.isListening) return 'Listening…'
    if (options.liveConversationActive) return 'Agent Speech — tap mic to speak'
    return 'Tap mic for Agent Speech, or type a message…'
  }

  if (options.agentBusy) {
    return 'Queue follow-up…'
  }

  return 'Send a message…'
}
