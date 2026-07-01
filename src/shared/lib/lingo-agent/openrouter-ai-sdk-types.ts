export type AiSdkToolChoice =
  | 'auto'
  | 'required'
  | 'none'
  | { type: 'tool'; toolName: string }
