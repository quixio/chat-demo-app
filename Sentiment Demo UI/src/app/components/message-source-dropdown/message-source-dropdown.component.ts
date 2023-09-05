import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { NewChatroomDialogComponent } from '../dialogs/new-chatroom-dialog/new-chatroom-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { QuixService } from 'src/app/services/quix.service';
import { ActivatedRoute, Router } from '@angular/router';

const QuixChatRoom = 'Quix chatroom';

@Component({
  selector: 'app-message-source-dropdown',
  templateUrl: './message-source-dropdown.component.html',
  styleUrls: ['./message-source-dropdown.component.scss']
})
export class MessageSourceDropdownComponent implements OnInit, OnDestroy {
  QuixChatRoom = QuixChatRoom;
  selectedRoom: string = QuixChatRoom;
  storedRooms: string[];
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  private unsubscribe = new Subject<void>();

  constructor(private matDialog: MatDialog, private quixService: QuixService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const localStorageValue = localStorage.getItem('rooms');
    this.storedRooms = localStorageValue ? JSON.parse(localStorageValue) : [];
    console.log('Rooms', this.storedRooms);

    // Preset the 
    console.log('QUIX service selection', this.quixService.selectedRoom);
    if (!this.storedRooms.includes(this.quixService.selectedRoom) && !QuixChatRoom) {
      this.storedRooms.push(this.quixService.selectedRoom);
    }
    this.selectedRoom = this.quixService.selectedRoom;

  }

  openCreateChatroomDialog(): void {
    const dialogRef = this.matDialog.open(NewChatroomDialogComponent, {
      maxWidth: '480px',
      data: {
        existingChatRooms: this.storedRooms
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.unsubscribe)).subscribe((result) => {    
      const {newRoom} = result;
      if (newRoom) {
        this.selectedRoom = newRoom;
        this.quixService.subscribeToRoom(newRoom);
      }
    });
  }

  prepareMenu(): void {
		setTimeout(() => {
			// Set the width of the menu to the width of the fake select input
			// eslint-disable-next-line no-underscore-dangle
			const triggerEle = (this.menuTrigger as any)._viewContainerRef.element.nativeElement;
			const menu = document.getElementById(this.menuTrigger.menu?.panelId!);
			menu?.setAttribute('style', `width:${triggerEle?.offsetWidth}px !important`);
		}, 0);
	}

  changeRoom(room?: string): void {
    this.selectedRoom = room ? room : QuixChatRoom;
    // Navigate to the current route with the updated query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { room: room },
    });
    // this.quixService.subscribeToRoom(this.selectedRoom);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

}
