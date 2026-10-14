import { UpdateDataService } from './../../../services/update-data-service';
import { Component, computed, OnInit, signal, effect, inject } from '@angular/core';
import axios from 'axios';
import { StatsRowRes } from '../../../Types/stats-bar-res';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-stats-row',
  imports: [DatePipe],
  templateUrl: './stats-row.html',
  styleUrl: './stats-row.css',
})
export class StatsRow {
  private updateDataService = inject(UpdateDataService)
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
  updateData = effect(async () => {
    this.updateDataService.updateEntriesVar()
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
