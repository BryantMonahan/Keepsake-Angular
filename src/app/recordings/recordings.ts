import { TranscriptionStatus } from './../Types/transcription-status';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppShell } from '../helpers/app-shell/app-shell';
import { CHIP_X } from '../helpers/ui-classes';
import { JournalEntry } from '../Types/journal-entry';
import { AlertService } from '../services/alert-service';
import { DataService } from '../services/data-service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../helpers/confirm-dialog/confirm-dialog';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js'
import { FormatDurationPipe } from '../pipes/format-duration-pipe';
import { Icon } from '../helpers/icon/icon';
import { themeColor } from '../helpers/theme-color';


export type StatusFilter = 'all' | 'transcribed' | 'processing' | 'none';
export type SortOrder = 'newest' | 'oldest' | 'longest' | 'shortest';
export type DatePreset = 'today' | '7d' | '30d' | 'year' | 'all';

@Component({
  selector: 'app-recordings',
  imports: [AppShell, RouterLink, DatePipe, FormatDurationPipe, Icon],
  templateUrl: './recordings.html',
})
export class Recordings implements OnInit {
  private alertService = inject(AlertService)
  private dataService = inject(DataService)
  private matDialog = inject(MatDialog)
  private route = inject(ActivatedRoute)
  private scroller = inject(ViewportScroller)
  // private location = inject(Location)

  TranscriptionStatus = TranscriptionStatus
  readonly chipX = CHIP_X
  waveSurfer = signal<WaveSurfer | null>(null)
  providedId = signal<string | null>(null)
  loading = signal(false)
  page = signal(0)

  statusFilter = signal<StatusFilter>('all')
  fromDate = signal<string | null>(null)
  toDate = signal<string | null>(null)
  sortOrder = signal<SortOrder>('newest')

  playingKey = signal<string | null>(null)
  isPlaying = signal(false)
  currentTime = signal(0)
  duration = signal(0)

  totalPages = computed(() => Math.ceil(this.filteredSorted().length / this.pageSize))
  rangeStart = computed(() => this.filteredSorted().length === 0 ? 0 : this.page() * this.pageSize + 1)
  rangeEnd = computed(() => Math.min((this.page() + 1) * this.pageSize, this.filteredSorted().length))
  hasActiveFilters = computed(() => this.statusFilter() !== 'all' || !!this.fromDate() || !!this.toDate())
  statusLabel = computed(() => {
    switch (this.statusFilter()) {
      case 'transcribed': return 'Transcribed'
      case 'processing': return 'Processing'
      case 'none': return 'No transcript'
      default: return 'All'
    }
  })

  readonly pageSize = 50

  entries = this.dataService.entries
  filteredSorted = computed<JournalEntry[]>(() => {
    let currEntries = this.entries().slice()

    // handle any filtering that's been applied
    if (this.hasActiveFilters()) {
      // filter by transcription status
      if (this.statusFilter() !== 'all') {
        currEntries = currEntries.filter((entry) => {
          if (this.statusFilter() === 'transcribed' && entry.transcribed === TranscriptionStatus.Transcribed) return entry
          if (this.statusFilter() === 'none' && entry.transcribed === TranscriptionStatus.NotTranscribed) return entry
          if (this.statusFilter() === 'processing' && entry.transcribed === TranscriptionStatus.Transcribing) return entry
          return null
        })
      }

      // filter by dates
      if (this.fromDate()) {
        const from = new Date(this.fromDate()!)
        from.setMinutes(from.getMinutes() + from.getTimezoneOffset())
        currEntries = currEntries.filter(entry => {
          if (new Date(entry.uploaded) >= from) {
            return entry
          } else {
            return null
          }
        })
      }
      if (this.toDate()) {
        const to = new Date(this.toDate()!)
        to.setMinutes(to.getMinutes() + to.getTimezoneOffset())
        currEntries = currEntries.filter(entry => {
          if (new Date(entry.uploaded) <= to) {
            return entry
          } else {
            return null
          }
        })
      }
    }

    // sort the array
    if (this.sortOrder() === 'newest') {
      currEntries.sort((a, b) => {
        return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
      })
    }

    if (this.sortOrder() === 'oldest') {
      currEntries.sort((a, b) => {
        return new Date(a.uploaded).getTime() - new Date(b.uploaded).getTime()
      })
    }

    if (this.sortOrder() === 'longest') {
      currEntries.sort((a, b) => {
        return b.secLength - a.secLength
      })
    }

    if (this.sortOrder() === 'shortest') {
      currEntries.sort((a, b) => {
        return a.secLength - b.secLength
      })
    }
    return currEntries
  })
  visible = computed(() => {
    return this.filteredSorted().slice(this.page() * this.pageSize, this.page() * this.pageSize + this.pageSize)
  })


  async ngOnInit() {
    try {
      this.loading.set(true)
      await this.dataService.loadEntries()
      // const id = this.route.snapshot.queryParams['id'] ?? null


      this.route.queryParams.subscribe({
        next: async (q) => {
          if (typeof q === 'object' && 'id' in q && typeof q['id'] === 'string') {
            let index = 0
            let entry = this.filteredSorted().find((e, i) => {
              if (e.id === q['id']) {
                index = i
                return true
              }
              return false
            })
            if (!entry) throw new Error("Entry could not be found")
            this.page.set(Math.floor(index / this.pageSize))
            await this.playAudio(entry.objectKey, false)
            this.pauseAudio()
            this.scroller.setOffset([0, 200])
            this.scroller.scrollToAnchor(q['id'])
          }
        }
      })

      this.loading.set(false)
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar('Something went wrong loading entries', 'red', 2000)
      this.loading.set(false)
    }
  }



  setStatusFilter(status: StatusFilter) {
    this.statusFilter.set(status)
    this.page.set(0)
  }

  setFromDate(event: Event) {
    const val = (event.target as HTMLInputElement).value
    console.log(val)
    this.fromDate.set(val)
    this.page.set(0)
  }

  setToDate(event: Event) {
    const val = (event.target as HTMLInputElement).value
    this.toDate.set(val)
    this.page.set(0)
  }

  setDatePreset(preset: DatePreset) {
    const time = new Date()
    this.toDate.set(`${time.getFullYear()}-${this.pad(time.getMonth() + 1)}-${this.pad(time.getDate())}`)
    if (preset === 'today') {
      this.fromDate.set(`${time.getFullYear()}-${this.pad(time.getMonth() + 1)}-${this.pad(time.getDate())}`)
    } else if (preset === '7d') {
      time.setDate(time.getDate() - 7)
      this.fromDate.set(`${time.getFullYear()}-${this.pad(time.getMonth() + 1)}-${this.pad(time.getDate())}`)
    } else if (preset === '30d') {
      time.setDate(time.getDate() - 30)
      this.fromDate.set(`${time.getFullYear()}-${this.pad(time.getMonth() + 1)}-${this.pad(time.getDate())}`)
    } else if (preset === 'year') {
      time.setDate(time.getDate() - 365)
      this.fromDate.set(`${time.getFullYear()}-${this.pad(time.getMonth() + 1)}-${this.pad(time.getDate())}`)
    } else {
      this.toDate.set(null)
      this.fromDate.set(null)
    }
  }
  pad(n: number) {
    return String(n).padStart(2, '0')
  }

  setSortOrder(event: Event) {
    const val = (event.target as HTMLInputElement).value as SortOrder
    this.sortOrder.set(val)
    this.page.set(0)
  }

  clearFilters() {
    this.statusFilter.set('all')
    this.fromDate.set(null)
    this.toDate.set(null)
    this.page.set(0)
  }

  goToPage(page: number) {
    this.page.set(page)
  }

  prevPage() {
    this.page.update(p => p - 1)
  }

  nextPage() {
    this.page.update(p => p + 1)
  }

  async playAudio(objectKey: string, autoPlay = true) {
    if (objectKey === this.playingKey()) {
      this.resumeAudio()
      return
    } else if (this.playingKey() !== null) {
      this.waveSurfer()?.destroy()
    }
    try {
      const urlRes = await axios.get<string>(`${import.meta.env.NG_APP_API_URL}/api/Audio/get-url`, {
        params: { objectKey }
      })
      this.waveSurfer.set(WaveSurfer.create({
        container: document.getElementById(objectKey)!,
        waveColor: themeColor('--color-rule-2'),
        progressColor: themeColor('--color-ink'),
        cursorColor: themeColor('--color-accent'),
        height: 56,
        barWidth: 2,
        barGap: 2,
        url: urlRes.data,
        dragToSeek: true,
      }))
      const entry = this.entries().find(entry => entry.objectKey === objectKey)
      if (entry === undefined) throw new Error("Entry does not appear in array of entries")
      this.duration.set(entry.secLength)
      if (this.waveSurfer()) {
        this.waveSurfer()?.on('ready', () => {
          this.playingKey.set(objectKey)
          if (autoPlay) {
            this.isPlaying.set(true)
            this.waveSurfer()?.play()
          }
        })
        this.waveSurfer()?.on('timeupdate', (time) => this.currentTime.set(time))
        this.waveSurfer()?.on('finish', () => {
          this.isPlaying.set(false)
        })
      }
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar('Something went wrong playing this entry', 'red', 2000)
      this.isPlaying.set(false)
      this.playingKey.set(null)
    }
  }

  pauseAudio() {
    this.waveSurfer()?.pause()
    this.isPlaying.set(false)
  }

  resumeAudio() {
    this.waveSurfer()?.play()
    this.isPlaying.set(true)
  }

  async favorite(entryId: string) {
    try {
      await this.dataService.toggleFavorite(entryId)
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar("Something went wrong favoriting entry", "red", 2000)
    }
  }

  async download(objectKey: string, fileName: string) {
    const urlRes = await axios.get<string>(`${import.meta.env.NG_APP_API_URL}/api/Audio/get-url`, {
      params: { objectKey }
    })
    const s3Res = await axios.get(urlRes.data, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(s3Res.data)
    const link = document.createElement('a')
    link.setAttribute('download', fileName)
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async delete(objectKey: string) {
    try {
      const confirmed = await this.confirmDelete()
      if (!confirmed) return
      await this.dataService.deleteEntry(objectKey)
      this.alertService.openSnackbar("Entry deleted", "green", 2000)
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar("Something went wrong deleting the file", "red", 2000)
    }
  }

  async confirmDelete(): Promise<boolean> {
    let matRef = this.matDialog.open(ConfirmDialog, { data: { message: "Are you sure you want to delete this entry?" } })
    let result = firstValueFrom(matRef.afterClosed())
    return result ?? false
  }
}
