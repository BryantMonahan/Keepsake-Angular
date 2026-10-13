import { MatDialog } from '@angular/material/dialog';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../helpers/confirm-dialog/confirm-dialog';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private matSnackBarService = inject(MatSnackBar)
  private matDialog = inject(MatDialog)

  openSnackbar(message: string, color: "green" | "red" | "yellow", duration: number
  ) {
    this.matSnackBarService.open(message, undefined, {
      duration,
      horizontalPosition: "center",
      panelClass: [`${color}-text-snackbar`]
    })
  }

  openAlert(message: string): Promise<boolean> {
    let matRef = this.matDialog.open(ConfirmDialog, { data: { message } })
    let result = firstValueFrom(matRef.afterClosed())
    return result ?? false
  }
}
