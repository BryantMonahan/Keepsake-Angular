import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppShell } from '../helpers/app-shell/app-shell';
import { StatsRow } from './components/stats-row/stats-row';
import { VoiceRecorder } from './components/voice-recorder/voice-recorder';
import { WeeklyStreak } from './components/weekly-streak/weekly-streak';
import { RecentEntries } from './components/recent-entries/recent-entries';
import { OnThisDay } from './components/on-this-day/on-this-day';
import { AuthService } from '../services/auth-service';
import { dayKey } from '../helpers/entry-dates';

@Component({
  selector: 'app-dashboard',
  imports: [AppShell, StatsRow, VoiceRecorder, WeeklyStreak, RecentEntries, OnThisDay, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private authService = inject(AuthService)
  username = this.authService.username()
  today = new Date()
  todayIso = dayKey(this.today)
  // If less than 12 morning, 12-18 afternoon, 18+ evening
  timeOfDay = signal(new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening")
}
