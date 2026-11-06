import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../helpers/app-shell/app-shell';

@Component({
  selector: 'app-transcripts',
  imports: [AppShell, RouterLink],
  templateUrl: './transcripts.html',
})
export class Transcripts implements OnInit {
  async ngOnInit() {
  }
}
