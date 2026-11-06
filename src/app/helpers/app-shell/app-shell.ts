import { Component } from '@angular/core';
import { Topbar } from '../../dashboard/components/topbar/topbar';
import { Sidebar } from '../../dashboard/components/sidebar/sidebar';

// The signed-in frame: a fixed sidebar from lg up, a drawer below it, the top bar, and the page in <main>
@Component({
  selector: 'app-shell',
  imports: [Topbar, Sidebar],
  host: { class: 'block' },
  template: `
    <div class="min-h-dvh bg-paper font-body text-ink">
      <input id="dashboard-drawer" type="checkbox" class="drawer-toggle sr-only lg:hidden" aria-label="Open menu" />

      <div class="flex min-h-dvh min-w-0 flex-col lg:ml-(--sidebar)">
        <app-topbar class="sticky top-0 z-(--z-sticky-nav) block" />
        <main class="mx-auto flex w-full max-w-(--container) flex-col gap-10 px-(--gutter) pt-10 pb-24">
          <ng-content />
        </main>
      </div>

      <div class="invisible fixed inset-0 z-(--z-modal) transition-[visibility] delay-(--dur-short) duration-0
                  drawer-open:visible drawer-open:delay-0
                  lg:visible lg:right-auto lg:z-(--z-raised) lg:w-(--sidebar)">
        <label for="dashboard-drawer" aria-label="Close menu"
          class="absolute inset-0 cursor-pointer bg-scrim opacity-0 transition-opacity duration-(--dur-short) ease-out drawer-open:opacity-100 lg:hidden"></label>
        <app-sidebar
          class="absolute inset-y-0 left-0 block w-[min(var(--sidebar),85%)] -translate-x-full transition-transform duration-(--dur-short) ease-out
                 drawer-open:translate-x-0 lg:static lg:h-full lg:w-auto lg:translate-x-0 lg:transition-none" />
      </div>
    </div>
  `,
})
export class AppShell { }
