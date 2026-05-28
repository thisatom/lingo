import { describe, expect, it } from 'vitest'
import { detectLocalSearchIntent } from './local-search-intent'
import { buildDirectLocalSearchReply, looksLikeClockOrDateAnswer } from './local-search-direct-reply'
import { looksTruncatedOrRefusal } from './web-search-intent'

describe('detectLocalSearchIntent', () => {
  it('detects “сколько сейчас время” as time', () => {
    expect(detectLocalSearchIntent('сколько сейчас время')).toEqual({ type: 'time' })
  })

  it('detects “который час” as time', () => {
    expect(detectLocalSearchIntent('который час')).toEqual({ type: 'time' })
  })
})

describe('buildDirectLocalSearchReply', () => {
  it('formats Russian clock answer from local time snippet', () => {
    const reply = buildDirectLocalSearchReply(
      { type: 'time', city: 'Москва' },
      [
        {
          title: 'Time — Moscow',
          url: '',
          snippet: 'Moscow, Russia: 03:14:32 GMT+3. Friday, May 22, 2026. Time zone: Europe/Moscow.'
        }
      ],
      'ru'
    )
    expect(reply).toBe('Сейчас в Москва: 03:14:32 GMT+3.')
  })
})

describe('looksTruncatedOrRefusal', () => {
  it('does not flag complete clock answers', () => {
    expect(looksLikeClockOrDateAnswer('Сейчас в Москве: 03:14:32.')).toBe(true)
    expect(looksTruncatedOrRefusal('Сейчас в Москве: 03:14:32.')).toBe(false)
  })

  it('still flags cut-off mid-word clock lines', () => {
    expect(looksTruncatedOrRefusal('Сейчас в Москве 03:14:32 (т')).toBe(true)
  })
})
