import { AlertService } from '../../../services/alert-service';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import axios from 'axios';
import { DataService } from '../../../services/data-service';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from "@angular/material/dialog"
import { ConfirmDialog } from '../../../helpers/confirm-dialog/confirm-dialog';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-recent-entries',
  imports: [DatePipe, FormField],
  templateUrl: './recent-entries.html',
  styleUrl: './recent-entries.css',
})
export class RecentEntries implements OnInit, OnDestroy {
  private alertService = inject(AlertService)
  private dataService = inject(DataService)
  private matDialog = inject(MatDialog)
  // the most recent entries that the user has made
  entries = computed(() => this.dataService.entries().slice(0, 5))
  // vars used to play audio
  private audio: HTMLAudioElement | null = null
  playingKey = signal<string | null>(null)
  isPlaying = signal(false)
  currentTime = signal(0)
  duration = signal(0)
  // used to keep track of what's being edited
  editing = signal<null | string>(null)
  // form data used to rename and change descriptions for journal entries
  entryModel = signal<{ name: string; description: string }>({
    name: '',
    description: ''
  })
  entryForm = form(this.entryModel, (schema) => {
    required(schema.name, { message: "A title is required" })
  })
  async ngOnInit() {
    try {
      await this.dataService.loadEntries()
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar('Something went wrong loading entries', 'red', 2000)
    }
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

  setEdit(id: string) {
    const entry = this.entries().find(e => e.id === id)
    console.log(entry)
    this.editing.set(id)
    this.entryModel.set({
      name: entry?.name ?? "",
      description: entry?.description ?? ""
    })
  }

  async saveEdit() {
    try {
      const editingId = this.editing()
      if (editingId === null) return
      // only send the fields the user changed
      const changes: { name?: string; description?: string } = {}
      if (this.entryForm.name().touched()) changes.name = this.entryForm.name().value()
      if (this.entryForm.description().touched()) changes.description = this.entryForm.description().value()
      await this.dataService.updateEntry(editingId, changes)
      this.alertService.openSnackbar('Changes saved', 'green', 2000)
    } catch (e) {
      this.alertService.openSnackbar('Something went wrong saving your changes', 'red', 2000)
      console.log(e)
    }
  }

  cancelEdit() {
    this.editing.set(null)
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

  async favorite(entryId: string) {
    try {
      await this.dataService.toggleFavorite(entryId)
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar("Something went wrong favoriting entry", "red", 2000)
    }
  }
}
