import { AlertService } from './alert-service';
import { inject, Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.js'

@Injectable({
  providedIn: 'root',
})
export class AudioRecordingService {
  private alertService = inject(AlertService)
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioBlobSubject = new Subject<Blob>();
  private waveSurfer = signal<WaveSurfer | null>(null)
  private record = signal<RecordPlugin | null>(null)
  recordingState = signal<RecordingState>("inactive")
  secondsElapsed = signal(0)
  timerInterval: ReturnType<typeof setInterval> | null = null
  audioBlob$: Observable<Blob> = this.audioBlobSubject.asObservable();

  async startRecording(container: string) {
    try {
      this.waveSurfer.set(WaveSurfer.create({
        container,
        waveColor: '#4F4A85',
        progressColor: '#383351',
        interact: false,
        height: 96,
        cursorWidth: 0
      }))

      this.record.set(this.waveSurfer()?.registerPlugin(RecordPlugin.create({
        renderRecordedAudio: true,
        scrollingWaveform: true,
      })) ?? null)
      this.record()?.on('record-end', (blob) => {
        this.audioBlobSubject.next(blob)
        this.waveSurfer()?.destroy()
        console.log('Type:', blob.type)
      })
      await this.record()?.startRecording()
      this.recordingState.set("recording")
      this.secondsElapsed.set(0)
      this.timerInterval = setInterval(() => this.secondsElapsed.update(t => t + .25), 250)
    } catch (error) {
      console.log(error)
      // tear down the half-created instance so the next attempt starts clean
      this.waveSurfer()?.destroy()
      this.waveSurfer.set(null)
      this.record.set(null)
      const message = error instanceof Error && error.message.includes('Requested device not found')
        ? "No microphone found. Plug one in or check your browser's mic settings."
        : 'Something went wrong starting to record'
      this.alertService.openSnackbar(message, 'red', 3000)
    }
  }

  pauseRecording() {
    if (this.record()) {
      this.record()?.pauseRecording()
      this.recordingState.set("paused")
      clearInterval(this.timerInterval!)
    }
  }

  resumeRecording() {
    if (this.record()) {
      this.record()?.resumeRecording()
      this.recordingState.set("recording")
      this.timerInterval = setInterval(() => this.secondsElapsed.update(t => t + .25), 250)
    }
  }

  async stopRecording() {
    if (this.record()) {
      this.record()?.stopRecording()
      this.recordingState.set("inactive")
      clearInterval(this.timerInterval!)
      this.secondsElapsed.set(0)
    }
  }
}
