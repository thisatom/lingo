declare module 'turndown' {
  export default class TurndownService {
    constructor(options?: Record<string, unknown>)
    remove(tags: string | string[]): TurndownService
    turndown(html: string): string
  }
}
