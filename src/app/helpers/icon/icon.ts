import { Component, input } from '@angular/core';

export type IconName =
  | 'mic' | 'dashboard' | 'timeline' | 'recordings' | 'transcripts' | 'calendar' | 'settings'
  | 'bell' | 'search' | 'menu' | 'play' | 'pause' | 'stop' | 'upload' | 'audio-file' | 'x'
  | 'check' | 'pencil' | 'star' | 'download' | 'trash' | 'chevron-down' | 'alert'
  | 'chevron-left' | 'chevron-right' | 'plus' | 'clock' | 'ear';

// One icon set (Lucide paths, 24 grid, 2px stroke), always decorative: the button or link carries the label
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styles: `:host { display: inline-flex; flex-shrink: 0; line-height: 0; }`,
})
export class Icon {
  name = input.required<IconName>();
  size = input<16 | 20 | 24>(20);
  filled = input(false);
}
