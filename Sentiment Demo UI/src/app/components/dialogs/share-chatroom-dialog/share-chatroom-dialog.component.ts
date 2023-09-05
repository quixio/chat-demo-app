import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuixService } from 'src/app/services/quix.service';

@Component({
  selector: 'app-share-chatroom-dialog',
  templateUrl: './share-chatroom-dialog.component.html',
  styleUrls: ['./share-chatroom-dialog.component.scss']
})
export class ShareChatroomDialogComponent implements OnInit {

  qrValue: string;


 constructor(@Inject(MAT_DIALOG_DATA) public data: any, private quixService: QuixService,
   public dialogRef: MatDialogRef<ShareChatroomDialogComponent>) { }

  ngOnInit(): void {
    let host = window.location.host;
    const url = `${window.location.protocol}//${host}?${this.quixService.selectedRoom}`
    
    this.qrValue = url;
  }

}
