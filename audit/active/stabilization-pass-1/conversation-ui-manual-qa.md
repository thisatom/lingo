# Conversation UI — Manual QA matrix

**Pass 2:** Run on desktop (`npm run dev`) after virtualizer scroll fixes.

## Scroll follow

| # | Steps | Expected |
|---|--------|----------|
| SF-1 | Open chat, send message, wait for long stream | Viewport follows tail until you scroll up |
| SF-2 | While agent streams, wheel up ~200px | Follow pauses; no jump back to bottom |
| SF-3 | Scroll to bottom (button or wheel) | Follow resumes; new tokens stick to bottom |
| SF-4 | Scroll horizontally inside code block | Chat follow does not pause |

## 100+ messages / virtualizer

| # | Steps | Expected |
|---|--------|----------|
| V-1 | Chat with 95+ turns, scroll mid-history | No jump when count crosses 100 (virtualizer on) |
| V-2 | Reload app on 100+ chat while scrolled mid-history | Restores near same turn (not top/bottom) |
| V-3 | Checkpoint edit on turn ~50 in 100+ chat | Edit shell visible; submit works |
| V-4 | Stream in 100+ chat while at bottom | Tail follows; no blank gaps |

## Regenerate / empty

| # | Steps | Expected |
|---|--------|----------|
| R-1 | Regenerate last reply at tail | Layout stable; no duplicate action bars |
| R-2 | Empty chat | Welcome/empty prompt; no scroll errors |
