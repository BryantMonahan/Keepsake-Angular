import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import axios from "axios";
import { LandingPage } from './landing-page/landing-page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('MyTimeline-Angular');
  content = signal("Nothing to show right now")

  async IWasClicked() {
    const content = await axios.post('https://localhost:7018/api/Auth/register',
      { Username: "Wagwan", Email: "Yolo", Password: "password" })
    console.log(content)
    this.content.set(content.data)
  }
}
