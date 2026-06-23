import { describe, expect, it } from 'vitest'
import {
  collapseInternalDuplicateTranscript,
  collapseRepeatedShortTokens,
  isLikelyGarbledTranscript,
  isLikelyWhisperHallucination,
  isTranscriptSuspiciousForDuration,
  isWhisperTimestampToken,
  parseWhisperCppBatchTranscription,
  parseWhisperCppTranscription,
  sanitizeWhisperTranscript,
  stripCumulativeWhisperTranscript,
  stripWhisperTimestamps
} from './whisper-transcript'

describe('stripWhisperTimestamps', () => {
  it('removes SRT-style markers from whisper.cpp VAD output', () => {
    expect(stripWhisperTimestamps('00:00:00,160 00:00:03,170 Ах, ты заебал')).toBe(
      'Ах, ты заебал'
    )
  })

  it('removes malformed negative timestamps', () => {
    expect(stripWhisperTimestamps('00:-16:-47.-280 Привет')).toBe('Привет')
  })
})

describe('parseWhisperCppTranscription', () => {
  it('drops timestamp-only segments', () => {
    expect(
      parseWhisperCppTranscription([
        '00:00:00,160',
        '00:00:03,170',
        'да ты заебал'
      ])
    ).toBe('да ты заебал')
  })

  it('uses the last speech segment when whisper prepends earlier blocks', () => {
    const rant = 'Да ты заебал, сделай нормальную транскрипцию'
    expect(
      parseWhisperCppTranscription([
        '00:-16:-47.-280',
        rant,
        '00:-16:-47.-280',
        rant,
        '00:-16:-47.-280',
        'Привет, меня зовут Эркстром'
      ])
    ).toBe('Привет, меня зовут Эркстром')
  })

  it('uses the last row from nested realtime output', () => {
    expect(
      parseWhisperCppTranscription([
        ['00:00:01,000', 'старый текст'],
        ['00:00:02,000', 'новый текст']
      ])
    ).toBe('новый текст')
  })

  it('recognises timestamp tokens', () => {
    expect(isWhisperTimestampToken('00:00:03,170')).toBe(true)
    expect(isWhisperTimestampToken('00:-16:-47.-280')).toBe(true)
    expect(isWhisperTimestampToken('привет')).toBe(false)
  })
})

describe('parseWhisperCppBatchTranscription', () => {
  it('joins all speech segments for a full recording', () => {
    expect(
      parseWhisperCppBatchTranscription([
        '00:00:00,160',
        'Первая',
        '00:00:03,170',
        'вторая фраза'
      ])
    ).toBe('Первая вторая фраза')
  })

  it('joins word tokens when whisper returns a flat list', () => {
    expect(parseWhisperCppBatchTranscription(['Так,', 'ну', 'сейчас', 'я', 'говорю'])).toBe(
      'Так, ну сейчас я говорю'
    )
  })
})

describe('isLikelyGarbledTranscript', () => {
  it('flags stem echo at the end', () => {
    expect(isLikelyGarbledTranscript('Так, ну сейчас я крошу, крош')).toBe(true)
  })

  it('accepts normal trailing words', () => {
    expect(isLikelyGarbledTranscript('Я поел яичницу и сейчас буду пить чай')).toBe(false)
  })
})

describe('stripCumulativeWhisperTranscript', () => {
  it('removes carry-over from the previous recording in the same worker', () => {
    const previous = 'Длинный текст из прошлой записи'
    const current = `${previous} Привет, новая фраза`
    expect(stripCumulativeWhisperTranscript(previous, current)).toBe('Привет, новая фраза')
  })
})

describe('collapseInternalDuplicateTranscript', () => {
  it('removes an immediate duplicated prefix within one result', () => {
    const rant = 'Да ты заебал, сделай нормальную транскрипцию'
    expect(collapseInternalDuplicateTranscript(`${rant} ${rant} Привет`)).toBe('Привет')
  })
})

describe('collapseRepeatedShortTokens', () => {
  it('collapses long runs of "ну"', () => {
    const input = 'Покатит? ну, ну, ну, ну, ну, ну, ну, ну, ну, ну'
    expect(sanitizeWhisperTranscript(input)).toBe('Покатит? ну, ну, ну')
  })
})

describe('isTranscriptSuspiciousForDuration', () => {
  it('rejects a one-word greeting on long audio', () => {
    expect(isTranscriptSuspiciousForDuration('Привет', 16_000 * 12)).toBe(true)
  })

  it('accepts a real sentence on long audio', () => {
    expect(
      isTranscriptSuspiciousForDuration(
        'Я поел яичницу и сейчас буду пить чай с печеньками',
        16_000 * 12
      )
    ).toBe(false)
  })
})

describe('isLikelyWhisperHallucination', () => {
  it('flags dominant short filler loops', () => {
    const hallucinated =
      'ну, ну, ну, ну, ну, ну, ну, ну, ну, ну, ну, ну, Пятый тоже не зайдет'
    expect(isLikelyWhisperHallucination(hallucinated)).toBe(true)
  })

  it('accepts normal short phrases', () => {
    expect(isLikelyWhisperHallucination('Покатит?')).toBe(false)
    expect(isLikelyWhisperHallucination('Hello, how are you today?')).toBe(false)
  })

  it('flags common silence hallucinations', () => {
    expect(isLikelyWhisperHallucination('Привет')).toBe(true)
    expect(isLikelyWhisperHallucination('Thank you for watching')).toBe(true)
  })
})
