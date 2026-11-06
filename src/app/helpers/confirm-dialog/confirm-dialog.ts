import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Icon],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  private dialogRef = inject<MatDialogRef<ConfirmDialog, boolean>>(MatDialogRef)
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  confirm() {
    this.dialogRef.close(true)
  }

  cancel() {
    this.dialogRef.close(false)
  }
}
