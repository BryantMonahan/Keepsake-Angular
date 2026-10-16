import { Injectable, signal } from '@angular/core';
import axios from 'axios';
import { JournalEntry } from '../Types/journal-entry';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private _entries = signal<JournalEntry[]>([])
  entries = this._entries.asReadonly()
  entriesChanged = signal(0)

  async loadEntries() {
    const entriesRes = await axios.get<JournalEntry[]>(`${import.meta.env.NG_APP_API_URL}/api/Audio/entries`)
    this._entries.set(entriesRes.data)
  }


  // Reload the entries and notify other components that the data has changed, call after a new entry is uploaded
  async refreshEntries() {
    this.entriesChanged.update(curr => curr + 1)
    await this.loadEntries()
  }

  // Update an entry's fields, only the fields that are passed are changed
  async updateEntry(id: string, changes: Partial<Pick<JournalEntry, 'name' | 'description' | 'favorite'>>) {
    await axios.post(`${import.meta.env.NG_APP_API_URL}/api/Audio/update-entry`, {
      Id: id,
      Name: changes.name ?? null,
      Description: changes.description ?? null,
      Favorite: changes.favorite ?? null
    })
    this._entries.update(entries => entries.map(entry => entry.id === id ? { ...entry, ...changes } : entry))
  }

  async toggleFavorite(id: string) {
    const entry = this._entries().find(e => e.id === id)
    if (!entry) throw new Error("Entry does not appear in array of entries")
    await this.updateEntry(id, { favorite: !entry.favorite })
  }

  async deleteEntry(objectKey: string) {
    await axios.delete(`${import.meta.env.NG_APP_API_URL}/api/Audio/delete-entry`, { headers: { ObjectKey: objectKey } })
    this._entries.update(entries => entries.filter(entry => entry.objectKey !== objectKey))
    this.entriesChanged.update(curr => curr + 1)
  }

  clearEntries() {
    this._entries.set([])
  }
}
