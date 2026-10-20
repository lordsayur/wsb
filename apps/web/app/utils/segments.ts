// specs/web/spec.md — seven-segment digit geometry for the tasbih display.
export type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'

export const DIGIT_SEGMENTS: Readonly<Record<string, readonly Segment[]>> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
}

/** Line endpoints in a 100×180 digit box. */
export const SEGMENT_LINES: Readonly<Record<Segment, readonly [number, number, number, number]>> = {
  a: [18, 12, 82, 12],
  b: [88, 22, 88, 82],
  c: [88, 98, 88, 158],
  d: [18, 168, 82, 168],
  e: [12, 98, 12, 158],
  f: [12, 22, 12, 82],
  g: [18, 90, 82, 90],
}

export function segmentsFor(digit: string): readonly Segment[] {
  return DIGIT_SEGMENTS[digit] ?? []
}

/** Zero-padded digit characters for a counter value, e.g. 42 → `0042`. */
export function displayDigits(value: number, places = 4): string[] {
  const clamped = Math.min(10 ** places - 1, Math.max(0, Math.trunc(value)))
  return [...String(clamped).padStart(places, '0')]
}
