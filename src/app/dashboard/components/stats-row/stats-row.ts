import { DataService } from './../../../services/data-service';
import { Component, computed, OnInit, signal, effect, inject } from '@angular/core';
import axios from 'axios';
import { StatsRowRes } from '../../../Types/stats-bar-res';

@Component({
  selector: 'app-stats-row',
  templateUrl: './stats-row.html',
})
export class StatsRow {
  private dataService = inject(DataService)
  totalEntries = signal(0)
  bytesUsed = signal(0)
  secondTotal = signal(0)
  transcribedTotal = signal(0)
  wordsTotal = signal(0)
  longestEntrySeconds = signal(0)
  percentTranscribed = computed(() => {
    if (this.totalEntries() === 0) return '0%'
    return ((Math.floor(this.transcribedTotal() / this.totalEntries() * 100))).toFixed(0).toString() + "%"
  })
  stats = computed(() => [
    { label: 'Total entries', value: String(this.totalEntries()), note: null },
    { label: 'Recorded time', value: clock(this.secondTotal()), note: 'Across all journals' },
    { label: 'Words transcribed', value: this.wordsTotal().toLocaleString(), note: `${this.percentTranscribed()} transcribed` },
    { label: 'Longest entry', value: clock(this.longestEntrySeconds()), note: null },
  ])
  updateData = effect(async () => {
    this.dataService.entriesChanged()
    await this.getStats()
  })


  async getStats() {
    const weeklyDataRes = await axios.get<StatsRowRes>(`${import.meta.env.NG_APP_API_URL}/api/Stats/stats-bar`)
    console.log(weeklyDataRes)
    this.totalEntries.set(weeklyDataRes.data.totalEntries)
    this.bytesUsed.set(weeklyDataRes.data.bytesUsed)
    this.secondTotal.set(weeklyDataRes.data.secondTotal)
    this.transcribedTotal.set(weeklyDataRes.data.transcribedTotal)
    this.wordsTotal.set(weeklyDataRes.data.wordsTotal)
    this.longestEntrySeconds.set(weeklyDataRes.data.longestEntrySeconds)
  }
}


// seconds as HH:mm:ss
function clock(seconds: number): string {
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')
  return `${pad(seconds / 3600)}:${pad((seconds % 3600) / 60)}:${pad(seconds % 60)}`
}
