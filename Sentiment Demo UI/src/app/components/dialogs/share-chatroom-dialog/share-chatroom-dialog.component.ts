import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RoomService } from 'src/app/services/room.service';

@Component({
  selector: 'app-share-chatroom-dialog',
  templateUrl: './share-chatroom-dialog.component.html',
  styleUrls: ['./share-chatroom-dialog.component.scss']
})
export class ShareChatroomDialogComponent implements OnInit {

  qrValue: string;

 constructor(@Inject(MAT_DIALOG_DATA) public data: any, private roomService: RoomService,
   public dialogRef: MatDialogRef<ShareChatroomDialogComponent>) { }

  ngOnInit(): void {
    let host = window.location.host;
    const url = `${window.location.protocol}//${host}?${this.roomService.selectedRoom}`
    this.qrValue = url;
  }

}
