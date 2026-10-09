import { Component, DestroyRef, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import axios, { AxiosProgressEvent } from 'axios';
import { UrlResponse } from '../../../Types/url-response';
import { AlertService } from '../../../services/alert-service';
import { UpdateDataService } from '../../../services/update-data-service';
import { AudioRecordingService } from '../../../services/audio-recording-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormatDurationPipe } from '../../../pipes/format-duration-pipe';
import { form, required, FormField } from '@angular/forms/signals';


@Component({
  selector: 'app-voice-recorder',
  imports: [FormatDurationPipe, FormField],
  templateUrl: './voice-recorder.html',
  styleUrl: './voice-recorder.css',
})
export class VoiceRecorder implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>
  @ViewChild('autoTranscribe') autoTranscribe!: ElementRef<HTMLInputElement>
  file: File | null = null
  showUpload = signal(false)
  uploading = signal(false)
  recordingState = signal<RecordingState>('inactive')
  secondsElapsed = signal(0)
  uploadPercentage = signal(0)
  uploadFileModel = signal<{ title: string; description: string }>({ title: '', description: '' })
  uploadFileForm = form(this.uploadFileModel, (schema) => {
    required(schema.title, { message: "A title is required" })
  })
  private alertService = inject(AlertService)
  private updateDataService = inject(UpdateDataService)
  private audioRecordingService = inject(AudioRecordingService)
  private destroyRef = inject(DestroyRef)

  ngOnInit() {
    this.audioRecordingService.audioBlob$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(blob => this.finishRecording(blob))
    this.recordingState = this.audioRecordingService.recordingState
    this.secondsElapsed = this.audioRecordingService.secondsElapsed
  }

  startRecording() {
    this.audioRecordingService.startRecording('#recorder')
  }

  pauseRecording() {
    this.audioRecordingService.pauseRecording()
  }

  resumeRecording() {
    this.audioRecordingService.resumeRecording()
  }

  stopRecording() {
    this.audioRecordingService.stopRecording()
  }

  async finishRecording(blob: Blob) {
    console.log("finished Recording")
    const now = new Date()
    console.log(blob.type)
    const fileName = `${now.toLocaleDateString().replaceAll('/', '-')}-${now.getHours()}-${now.getMinutes()}.${blob.type.replace('audio/', '').replace(';codecs=opus', '')}`
    const file = new File([blob], fileName, {
      type: blob.type,
      lastModified: Date.now()
    })

    console.log(file)

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    if (this.fileInput) {
      this.fileInput.nativeElement.files = dataTransfer.files
      this.onFileSelected()
    }
  }

  async uploadFile() {
    if (this.file === null) return
    if (!this.uploadFileForm.title().valid()) {
      this.alertService.openSnackbar("Please add a title", "red", 2000)
      return
    }
    let transcribe = false
    try {
      if (this.autoTranscribe && this.autoTranscribe.nativeElement.checked.valueOf()) {
        const res = await axios.get<{ transcriptionsLeft: number }>(`${import.meta.env.NG_APP_API_URL}/api/Stats/transcriptions-left`)
        if (res.data.transcriptionsLeft === 0) {
          this.alertService.openSnackbar("You are out of free transcriptions", "red", 2000)
        } else if (res.data.transcriptionsLeft !== -1) {
          const cont = await this.alertService.openAlert(`You only have ${res.data.transcriptionsLeft} transcripts left. Do you want to continue?`)
          if (!cont) return
          transcribe = true
        } else {
          transcribe = true
        }
      }
      this.uploadPercentage.set(0)
      this.uploading.set(true)
      // get the presigned URL to upload the file
      const urlRes = await axios.get<UrlResponse>(`${import.meta.env.NG_APP_API_URL}/api/Audio/post-url`, {
        params: { fileName: this.file.name }
      })

      // upload file to S3 bucket
      try {
        await axios.put(urlRes.data.url, this.file, {
          headers: { 'Content-Type': this.file.type },
          ...this.progressConfig
        })
      } catch (error) {
        console.log(error)
        // throw our own error to prevent AWS error messages from being displayed
        throw new Error("File could not be uploaded")
      }

      // check that the file was uploaded
      await axios.post(`${import.meta.env.NG_APP_API_URL}/api/Audio/confirm-upload`, {
        ObjectKey: urlRes.data.key,
        Title: this.uploadFileForm.title().value(),
        Description: this.uploadFileForm.description().value(),
        Transcribe: transcribe
      })
      this.alertService.openSnackbar("File uploaded 🎉", "green", 3000)
      // trigger other components to reload data
      this.updateDataService.updateEntries()

    } catch (error) {
      console.log(error)
      // Alert user to error
      let errorMsg = "File could not be uploaded"
      if (axios.isAxiosError(error) || error instanceof Error) {
        errorMsg + `:\n${error.message}`
      }
      this.alertService.openSnackbar(errorMsg, "red", 3000)
    } finally {
      // reset the upload fields
      this.uploading.set(false)
      this.showUpload.set(false)
      this.file = null
      this.fileInput.nativeElement.value = ''
    }
  }


  /**
   * Set our file var to the file uploaded or reset var if not file was given
   * @param event File change event
   */
  onFileSelected(event?: Event) {
    if (event) event.preventDefault()
    const input = this.fileInput.nativeElement
    if (input.files && input.files.length > 0) {
      this.file = input.files[0]
      this.showUpload.set(true)
      this.uploadFileForm.title().controlValue.set(this.file.name)
    } else {
      this.file = null
      this.showUpload.set(false)
      this.uploadFileForm.title().controlValue.set("")
    }
  }

  // pass to axios to update the upload progress %
  progressConfig = {
    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
      const { loaded, total } = progressEvent;

      if (total) {
        const percentage = Math.round((loaded * 100) / total)
        this.uploadPercentage.set(percentage)
      }
    }
  }

  async removeFile() {
    const confirm = await this.alertService.openAlert("Are you sure you want to remove this entry?")
    if (confirm) {
      this.file = null
      this.showUpload.set(false)
      this.uploadFileForm.title().controlValue.set("")
    }
  }
}
