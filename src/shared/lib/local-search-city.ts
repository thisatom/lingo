/** Normalize city names for geocoding (Russian cases, common aliases). */

const CITY_ALIASES: Record<string, string> = {
  екатеринбурге: 'Yekaterinburg',
  екатеринбург: 'Yekaterinburg',
  москве: 'Moscow',
  москва: 'Moscow',
  петербурге: 'Saint Petersburg',
  'санкт-петербурге': 'Saint Petersburg',
  'санкт-петербург': 'Saint Petersburg',
  новосибирске: 'Novosibirsk',
  новосибирск: 'Novosibirsk',
  казани: 'Kazan',
  казань: 'Kazan',
  нижнем: 'Nizhny Novgorod',
  'нижнем новгороде': 'Nizhny Novgorod',
  самаре: 'Samara',
  самара: 'Samara',
  красноярске: 'Krasnoyarsk',
  красноярск: 'Krasnoyarsk',
  'нижнем тагиле': 'Nizhny Tagil',
  сочи: 'Sochi',
  владивостоке: 'Vladivostok',
  владивосток: 'Vladivostok'
}

function hasCyrillic(text: string): boolean {
  return /[а-яё]/i.test(text)
}

function stripRussianCaseEnding(city: string): string | null {
  if (!hasCyrillic(city)) return null

  if (/бурге$/i.test(city)) return city.replace(/бурге$/i, 'бург')
  if (/городе$/i.test(city)) return city.replace(/городе$/i, 'город')
  if (/ске$/i.test(city) && city.length > 4) return city.slice(0, -1)
  if (/и$/i.test(city) && city.length > 3) return `${city.slice(0, -1)}ь`
  if (/е$/i.test(city) && city.length > 3) return city.slice(0, -1)

  return null
}

/** Try several spellings so Open-Meteo / wttr.in resolve the city. */
export function cityGeocodeVariants(city: string): string[] {
  const trimmed = city.replace(/[?.!,;:]+$/g, '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return []

  const out: string[] = []
  const push = (value: string) => {
    const v = value.trim()
    if (v.length >= 2 && !out.includes(v)) out.push(v)
  }

  push(trimmed)

  const alias = CITY_ALIASES[trimmed.toLowerCase()]
  if (alias) push(alias)

  const stripped = stripRussianCaseEnding(trimmed)
  if (stripped) {
    push(stripped)
    const strippedAlias = CITY_ALIASES[stripped.toLowerCase()]
    if (strippedAlias) push(strippedAlias)
  }

  return out
}

export function geocodeLanguageForCity(city: string): string {
  return hasCyrillic(city) ? 'ru' : 'en'
}
