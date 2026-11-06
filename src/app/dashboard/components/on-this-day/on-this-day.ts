import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../services/data-service';
import { JournalEntry } from '../../../Types/journal-entry';
import { addDays, dayKey, entryDate, monthsBefore } from '../../../helpers/entry-dates';
import { FormatDurationPipe } from '../../../pipes/format-duration-pipe';

interface Lookback {
  label: string
  date: Date
  entries: JournalEntry[]
}

// Brings back what was recorded on this date a week, a month and a year ago.
// Reads the entries the dashboard already loads, so it makes no request of its own.
@Component({
  selector: 'app-on-this-day',
  imports: [DatePipe, RouterLink, FormatDurationPipe],
  templateUrl: './on-this-day.html',
})
export class OnThisDay {
  private dataService = inject(DataService)

  lookbacks = computed<Lookback[]>(() => {
    const today = new Date()
    const byDay = new Map<string, JournalEntry[]>()
    for (const entry of this.dataService.entries()) {
      const key = dayKey(entryDate(entry))
      byDay.set(key, [...(byDay.get(key) ?? []), entry])
    }
    const yearAgo = monthsBefore(today, 12)
    return [
      { label: 'A week ago', date: addDays(today, -7) },
      { label: 'A month ago', date: monthsBefore(today, 1) },
      { label: 'A year ago', date: yearAgo },
    ].map(({ label, date }) => ({ label, date, entries: byDay.get(dayKey(date)) ?? [] }))
  })

  hasAny = computed(() => this.lookbacks().some(l => l.entries.length > 0))
}
