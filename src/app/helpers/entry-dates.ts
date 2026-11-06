import { JournalEntry } from '../Types/journal-entry';

// When an entry happened: the recording's own date if we have it, otherwise when it was uploaded
export function entryDate(entry: Pick<JournalEntry, 'created' | 'uploaded'>): Date {
  return new Date(entry.created ?? entry.uploaded)
}

// A local calendar day as YYYY-MM-DD, used to group and compare entries by day
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date)
  next.setDate(next.getDate() + days)
  return next
}

// Same day of the month, n months back; clamps the 31st to the last day of a shorter month
export function monthsBefore(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() - months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay))
}
