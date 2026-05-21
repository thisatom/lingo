import { CHAT_STARTER_PROMPTS } from '@/widgets/conversation-panel/lib/chat-starter-prompts'
import { TextType } from '@/shared/ui/TextType'
import { cn } from '@/shared/lib/utils'

export function ChatEmptyPrompt({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none w-full text-center', className)}>
      <TextType
        as="p"
        text={[...CHAT_STARTER_PROMPTS]}
        typingSpeed={42}
        deletingSpeed={28}
        pauseDuration={2400}
        loop
        showCursor
        cursorCharacter="|"
        className="mx-auto block max-w-md text-center text-[13px] leading-[1.5] text-muted-foreground"
      />
    </div>
  )
}
