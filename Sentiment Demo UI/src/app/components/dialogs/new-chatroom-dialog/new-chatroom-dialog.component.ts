import { Component, Inject, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuixChatRoom } from 'src/app/services/room.service';

/**
 * Custom Validator to handle the logic of ensuring the
 * name of the room provided doesn't already exist.
 * 
 * @param existingRooms list of existing rooms.
 * 
 * @returns whether the proposed name exists or not.
 */
function uniqueRoomValidator(existingRooms: string[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value.toLowerCase();
    existingRooms = existingRooms.map((m) => m.toLowerCase())
    if (existingRooms?.includes(value)) {
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

  @Input() existingChatRooms: string[];

  nameFC = new FormControl('', [Validators.required]);
  form = new FormGroup({
    name: this.nameFC
  })

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<NewChatroomDialogComponent>) { }

  ngOnInit(): void {
    // Get the list and the default quix chat room
    this.existingChatRooms = this.data.existingChatRooms;
    this.existingChatRooms.push(QuixChatRoom);

    this.nameFC.addValidators(uniqueRoomValidator(Array.from(this.existingChatRooms)));
  }

  createRoom(): void {
    const newRoom = this.nameFC.value;
    this.dialogRef.close({ newRoom });
  }

}
