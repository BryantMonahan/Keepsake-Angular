import { Component, effect, inject, OnInit, signal } from '@angular/core';
import axios from 'axios';
import { DataService } from '../../../services/data-service';

@Component({
  selector: 'app-weekly-streak',
  imports: [],
  templateUrl: './weekly-streak.html',
})
export class WeeklyStreak {
  private Days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  private dataService = inject(DataService)
  days = signal<{ day: string; dow: number; active: boolean }[]>([])
  numOfEntriesText = signal("No entries")
  updateData = effect(async () => {
    this.dataService.entriesChanged()
    await this.getPastSevenDays()
  })

  async getPastSevenDays() {
    const curr = new Date()
    const weeklyStreakRes = await axios.get<boolean[]>(`${import.meta.env.NG_APP_API_URL}/api/Stats/past-seven-days`, {
      params: {
        MinutesPastMidnight: curr.getHours() * 60 + curr.getMinutes()
      }
    })
    console.log("HERE", weeklyStreakRes)
    const day = new Date()
    let activeDays = 0
    const days: { day: string; dow: number; active: boolean }[] = []
    for (const active of weeklyStreakRes.data) {
      if (active) activeDays++
      days.push({ day: this.Days[day.getDay()][0], dow: day.getDay(), active })
      day.setDate(day.getDate() - 1)
    }
    // flip it so Today is on the right
    days.reverse()
    this.days.set(days)
    this.numOfEntriesText.set(activeDays === 1 ? "1 day" : `${activeDays} days`)
  }
}
