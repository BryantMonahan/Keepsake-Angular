import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../helpers/app-shell/app-shell';
import { DataService } from '../services/data-service';
import { TranscriptionStatus } from '../Types/transcription-status';
import { AlertService } from '../services/alert-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent, NgOptionTemplateDirective } from '@ng-select/ng-select';
import { HighlightPipe } from '../pipes/highlight-pipe';
import { MatTooltip } from '@angular/material/tooltip';
import Fuse from 'fuse.js';
import { Icon } from '../helpers/icon/icon';
import { JournalEntry } from '../Types/journal-entry';
import { SortOrder } from '../recordings/recordings';

@Component({
  selector: 'app-transcripts',
  imports: [AppShell, RouterLink, CommonModule, FormsModule, HighlightPipe, MatTooltip, Icon],
  templateUrl: './transcripts.html',
})
export class Transcripts implements OnInit {
  private dataService = inject(DataService)
  private alertService = inject(AlertService)
  fromDate = signal<string | null>(null)
  toDate = signal<string | null>(null)
  searchInput = signal<string | null>(null)
  keywords = computed(() => this.searchInput()?.split(" "))
  allTranscribed = computed(() => {
    return this.dataService.entries().filter(e => e.transcribed === TranscriptionStatus.Transcribed)
  })
  fuse = computed(() => {
    return new Fuse(this.allTranscribed(), {
      keys: [
        { name: 'name', weight: .1 },
        { name: 'transcription', weight: .9 }
      ],
      threshold: .4,
      includeScore: true,
      includeMatches: true
    })
  })
  filteredEntries = computed(() => {
    return this.fuse().search(this.searchInput() ?? "").map(res => res.item)
  })

  readonly pageSize = 50
  page = signal(0)
  sortOrder = signal<SortOrder>('newest')

  totalPages = computed(() => Math.ceil(this.filteredSorted().length / this.pageSize))
  rangeStart = computed(() => this.filteredSorted().length === 0 ? 0 : this.page() * this.pageSize + 1)
  rangeEnd = computed(() => Math.min((this.page() + 1) * this.pageSize, this.filteredSorted().length))

  filteredSorted = computed<JournalEntry[]>(() => {
    const currEntries = this.filteredEntries().slice()

    if (this.sortOrder() === 'newest') {
      currEntries.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
    }
    if (this.sortOrder() === 'oldest') {
      currEntries.sort((a, b) => new Date(a.uploaded).getTime() - new Date(b.uploaded).getTime())
    }
    if (this.sortOrder() === 'longest') {
      currEntries.sort((a, b) => b.secLength - a.secLength)
    }
    if (this.sortOrder() === 'shortest') {
      currEntries.sort((a, b) => a.secLength - b.secLength)
    }
    return currEntries
  })

  visible = computed(() => {
    return this.filteredSorted().slice(this.page() * this.pageSize, this.page() * this.pageSize + this.pageSize)
  })

  async ngOnInit() {
    console.log(this.allTranscribed())
    try {
      await this.dataService.loadEntries()
    } catch (error) {
      console.log(error)
      this.alertService.openSnackbar('Something went wrong loading entries', 'red', 2000)
    }
  }

  setSortOrder(event: Event) {
    const val = (event.target as HTMLInputElement).value as SortOrder
    this.sortOrder.set(val)
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
}
