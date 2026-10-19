/**
 * Alternates 0/1 per calendar week (weeks start Monday) so consecutive week
 * rows in the month table can form subtle bands.
 */
export function weekBand(date: string): 0 | 1 {
  const [year, month, day] = date.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  const firstWeekday =
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  return (Math.floor((day - 1 + firstWeekday) / 7) % 2) as 0 | 1
}
