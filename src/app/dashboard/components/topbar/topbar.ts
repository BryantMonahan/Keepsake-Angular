import { DataService } from './../../../services/data-service';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import Fuse from 'fuse.js'
import { JournalEntry } from '../../../Types/journal-entry';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgOptionTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, FormsModule, NgSelectComponent, NgOptionTemplateDirective],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private dataService = inject(DataService)
  private router = inject(Router)
  @ViewChild(NgSelectComponent) ngSelectComponent!: NgSelectComponent
  filteredEntries = computed(() => {
    if (this.searchTerm() === "") {
      return this.dataService.entries()
    }
    return this.fuse().search(this.searchTerm()).map((res) => res.item)
  })
  selectedId: any = null
  searchTerm = signal('')
  fuse = computed(() => {
    return new Fuse(this.dataService.entries(), {
      keys: [
        { name: 'name', weight: .5 },
        { name: 'description', weight: .3 },
        { name: 'summary', weight: .2 }
      ],
      threshold: .4,
      includeScore: true,
      includeMatches: true
    })
  })

  filterEntries(event: { term: string }) {
    this.searchTerm.set(event.term)
  }

  goToEntry(event: JournalEntry | undefined) {
    if (!event) return // clearing the model triggers a change which passes an undefined object
    this.router.navigate(['/recordings'], { queryParams: { id: event.id } })
    this.ngSelectComponent.clearModel()
  }
}
