import { AlertService } from '../../../services/alert-service';
import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import axios from 'axios';
import { JournalEntry } from '../../../Types/journal-entry';
import { UpdateDataService } from '../../../services/update-data-service';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from "@angular/material/dialog"
import { ConfirmDialog } from '../../../helpers/confirm-dialog/confirm-dialog';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-recent-entries',
  imports: [DatePipe],
  templateUrl: './recent-entries.html',
  styleUrl: './recent-entries.css',
})
export class RecentEntries implements OnDestroy {
  private alertService = inject(AlertService)
  private updateDataService = inject(UpdateDataService)
  private matDialog = inject(MatDialog)
  entries = signal<JournalEntry[]>([])
  private audio: HTMLAudioElement | null = null
  playingKey = signal<string | null>(null)
  isPlaying = signal(false)
  currentTime = signal(0)
  duration = signal(0)
  updateData = effect(async () => {
    this.updateDataService.updateEntriesVar()
    await this.getEntries()
  })


  async getEntries() {
    // get the most recent entries that the user has made
    const recentEntriesRes = await axios.get<JournalEntry[]>(`${import.meta.env.NG_APP_API_URL}/api/Audio/most-recent-entries`, {
      params: {
        numOfEntries: 5
      }
    })
    this.entries.set(recentEntriesRes.data)
    console.log(this.entries())
  }

  async playAudio(objectKey: string) {
    try {
      // resume the current entry if it is already loaded
      if (this.playingKey() === objectKey && this.audio) {
        await this.audio.play()
        return
      }
      this.stopAudio()
      const urlRes = await axios.get<string>(`${import.meta.env.NG_APP_API_URL}/api/Audio/get-url`, {
        params: { objectKey }
      })
      const audio = new Audio(urlRes.data)
      audio.onloadedmetadata = () => this.duration.set(audio.duration)
      audio.ontimeupdate = () => this.currentTime.set(audio.currentTime)
      audio.onplay = () => this.isPlaying.set(true)
      audio.onpause = () => this.isPlaying.set(false)
      audio.onended = () => this.isPlaying.set(false)
      this.audio = audio
      this.playingKey.set(objectKey)
      await audio.play()
    } catch (error) {
      console.log(error)
      this.stopAudio()
      this.alertService.openSnackbar("Something went wrong playing the file", "red", 2000)
    }
  }

  pauseAudio() {
    this.audio?.pause()
  }

  seek(event: Event) {
    if (!this.audio) return
    const time = Number((event.target as HTMLInputElement).value)
    this.audio.currentTime = time
    this.currentTime.set(time)
  }

  private stopAudio() {
    this.audio?.pause()
    this.audio = null
    this.playingKey.set(null)
    this.isPlaying.set(false)
    this.currentTime.set(0)
    this.duration.set(0)
  }

  ngOnDestroy() {
    this.stopAudio()
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

  async delete(id: string) {
    try {
      const confirmed = await this.confirmDelete()
      if (!confirmed) return
      const deleteEntryRes = await axios.delete(`${import.meta.env.NG_APP_API_URL}/api/Audio/delete-entry`, { headers: { ObjectKey: id } })
      this.updateDataService.updateEntries()
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

  async favorite(entryId: string) {
    try {
      await axios.post(`${import.meta.env.NG_APP_API_URL}/api/Audio/favorite`, {
        Id: entryId
      })
      // flip the var in our array. No other component depends on an entry being favorited so it doesn't need to trigger a data refresh
      this.entries.update(entries => entries.map(entry => {
        if (entry.id === entryId) {
          entry.favorite = !entry.favorite
          return entry
        } else {
          return entry
        }
      }))
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar("Something went wrong favoriting entry", "red", 2000)
    }
  }
}
