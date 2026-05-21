const PREVIEW_BY_LANG: Record<string, string> = {
  en: 'This is how your assistant will sound.',
  de: 'So wird die Stimme des Assistenten klingen.',
  es: 'Así sonará la voz del asistente.',
  fr: 'Voici à quoi ressemblera la voix de l’assistant.',
  it: 'Ecco come suonerà la voce dell’assistente.',
  pt: 'É assim que a voz do assistente vai soar.',
  ru: 'Так будет звучать голос ассистента.',
  ja: 'アシスタントの声はこのように聞こえます。',
  zh: '这是助手语音的试听效果。',
  ko: '어시스턴트 목소리는 이렇게 들립니다.',
  pl: 'Tak będzie brzmiał głos asystenta.',
  nl: 'Zo klinkt de stem van de assistent.',
  tr: 'Asistan sesi böyle duyulacak.'
}

export function getTtsPreviewPhrase(language: string): string {
  const lang = language.trim().toLowerCase().split('-')[0] ?? 'en'
  return PREVIEW_BY_LANG[lang] ?? PREVIEW_BY_LANG.en
}
