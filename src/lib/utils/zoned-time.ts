const SESSION_TIME_ZONE = process.env.APP_TIME_ZONE?.trim() || 'Africa/Kigali'

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date)
  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>
}

export function localDateTimeToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match
  const expected = {
    year: Number(yearRaw), month: Number(monthRaw), day: Number(dayRaw),
    hour: Number(hourRaw), minute: Number(minuteRaw)
  }
  if (expected.month < 1 || expected.month > 12 || expected.day < 1 || expected.day > 31 ||
      expected.hour > 23 || expected.minute > 59) return null
  const localAsUtc = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute)
  const initialParts = partsAt(new Date(localAsUtc), SESSION_TIME_ZONE)
  const initialOffset = Date.UTC(Number(initialParts.year), Number(initialParts.month) - 1,
    Number(initialParts.day), Number(initialParts.hour), Number(initialParts.minute), Number(initialParts.second)) - localAsUtc
  const candidate = new Date(localAsUtc - initialOffset)
  const actual = partsAt(candidate, SESSION_TIME_ZONE)
  if (Number(actual.year) !== expected.year || Number(actual.month) !== expected.month ||
      Number(actual.day) !== expected.day || Number(actual.hour) !== expected.hour ||
      Number(actual.minute) !== expected.minute) return null
  return candidate.toISOString()
}

export function formatSessionDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat('en-RW', {
    timeZone: SESSION_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function sessionDateIso(value: string | Date): string {
  const parts = partsAt(new Date(value), SESSION_TIME_ZONE)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function sessionDateTimeLocalValue(value: string | Date): string {
  const parts = partsAt(new Date(value), SESSION_TIME_ZONE)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}
