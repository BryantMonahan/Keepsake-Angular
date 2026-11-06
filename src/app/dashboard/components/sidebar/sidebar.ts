import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon, IconName } from '../../../helpers/icon/icon';

interface RailLink {
  label: string
  icon: IconName
  // no path means the page isn't built yet, and the link shows as disabled
  path?: string
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly links: RailLink[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Timeline', icon: 'timeline' },
    { label: 'Calendar', icon: 'calendar' },
    { label: 'Recordings', icon: 'recordings', path: '/recordings' },
    { label: 'Transcripts', icon: 'transcripts', path: '/transcripts' },
    { label: 'Settings', icon: 'settings' },
  ]

  readonly linkClass = [
    'flex min-h-10 items-center gap-3 rounded-input px-3 text-md font-medium text-ink-2 no-underline',
    'transition-colors duration-(--dur-micro) ease-out',
    '[&[href]]:hover:bg-paper-3 [&[href]]:hover:text-ink [&[href]]:active:bg-accent-soft',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
    'aria-disabled:cursor-not-allowed aria-disabled:text-muted',
    '[&.is-active]:bg-surface [&.is-active]:text-ink [&.is-active]:shadow-[inset_0_1px_0_var(--glint),0_1px_2px_var(--color-scrim)]',
  ].join(' ')
}
