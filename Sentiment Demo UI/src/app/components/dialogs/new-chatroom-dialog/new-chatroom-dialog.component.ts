import { Component, Inject, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

function uniqueStringValidator(uniqueStrings: string[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value;
    if (uniqueStrings?.includes(value)) {
      return { 'uniqueName': true };
    }
    return null;
  };
}

@Component({
  selector: 'app-new-chatroom-dialog',
  templateUrl: './new-chatroom-dialog.component.html',
  styleUrls: ['./new-chatroom-dialog.component.scss']
})
export class NewChatroomDialogComponent implements OnInit {

  existingChatRooms: string[];

  nameFC = new FormControl('', [Validators.required]);
  form = new FormGroup({
    name: this.nameFC
  })

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<NewChatroomDialogComponent>) { }

  ngOnInit(): void {
    this.nameFC.addValidators(uniqueStringValidator(this.existingChatRooms));
  }

  create(): void {
    const newRoom = this.nameFC.value;
    this.dialogRef.close({ newRoom });
  }

}
