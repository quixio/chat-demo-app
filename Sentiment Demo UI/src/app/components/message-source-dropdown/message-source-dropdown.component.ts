import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { NewChatroomDialogComponent } from '../dialogs/new-chatroom-dialog/new-chatroom-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { ConnectionStatus, QuixService } from 'src/app/services/quix.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TwitchService } from 'src/app/services/twitch.service';
import { ActiveStream, ActiveStreamAction } from 'src/app/models/activeStream';
import { QuixChatRoom, RoomService } from 'src/app/services/room.service';


@Component({
  selector: 'app-message-source-dropdown',
  templateUrl: './message-source-dropdown.component.html',
  styleUrls: ['./message-source-dropdown.component.scss']
})
export class MessageSourceDropdownComponent implements OnInit, OnDestroy {

  @ViewChild('twitchWrapper') twitchWrapper: ElementRef<HTMLElement>;

  QuixChatRoom = QuixChatRoom;
  selectedRoom: string | undefined = QuixChatRoom;
  storedRooms: string[];
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  channels = new Set<string>();
  isLoadingChannels: boolean = true;

  private unsubscribe = new Subject<void>();

  constructor(private matDialog: MatDialog, private roomService: RoomService, private twitchService: TwitchService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.roomService.roomChanged$.pipe(takeUntil(this.unsubscribe)).subscribe(({roomId}) => {
      this.selectedRoom = roomId;
    });

    this.roomService.previousRooms$.pipe(takeUntil(this.unsubscribe)).subscribe((rooms) => {
      this.storedRooms = rooms!;
    });

    this.twitchService.getActiveStreams$().pipe(takeUntil(this.unsubscribe)).subscribe((activeStreamsSubs) => {
      this.isLoadingChannels = false;
      this.setActiveSteams(activeStreamsSubs?.streams!, activeStreamsSubs?.action);
    });
  }

  setActiveSteams(streamData: ActiveStream[], streamAction?: ActiveStreamAction): void {
    if (streamAction) {
      if (streamAction === ActiveStreamAction.AddUpdate) {
        if (streamData[0]) this.channels.add(streamData[0].streamId);
      } else if (streamAction === ActiveStreamAction.Remove) {
				this.channels.delete(streamData[0]?.streamId);
			}
    } else {
      const streams = streamData.map((m) => m.streamId);
      this.channels = new Set(streams);
    }

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
        this.changeRoom(newRoom);
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

  changeRoom(room?: string, isTwitch?: boolean): void {
    // Navigate to the current route with the updated query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [isTwitch ? 'twitchRoom' : 'room']: room },
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

}
