import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { NewChatroomDialogComponent } from '../dialogs/new-chatroom-dialog/new-chatroom-dialog.component';
import { Subject, map, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TwitchService } from 'src/app/services/twitch.service';
import { ActiveStream, ActiveStreamAction } from 'src/app/models/activeStream';
import { QuixChatRoom, RoomService } from 'src/app/services/room.service';
import { QuixService } from 'src/app/services/quix.service';


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
  @ViewChild(MatMenuTrigger, { static: true }) menuTrigger: MatMenuTrigger;

  channels = new Set<string>();
  isLoadingChannels: boolean = true;

  private unsubscribe = new Subject<void>();

  constructor(
    private matDialog: MatDialog,
    private quixService: QuixService, 
    private roomService: RoomService, 
    private twitchService: TwitchService, 
    private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Listen for changes in the selected room
    this.roomService.roomChanged$.pipe(takeUntil(this.unsubscribe)).subscribe(({roomId}) => {
      this.selectedRoom = roomId;
    });

    // Listens for changes in the list of previous rooms
    this.roomService.previousRooms$.pipe(takeUntil(this.unsubscribe)).subscribe((rooms) => {
      this.storedRooms = rooms!;
    });

    // Listener to retrieve all the active streams on twitch
    this.twitchService.getActiveStreams$().pipe(
      map((streamSub) => {
        if (streamSub?.streams) {
          streamSub.streams = streamSub?.streams?.filter((f) => f.topicId === this.quixService.twitchMessagesTopic)
        }
        return streamSub;
      }),
      takeUntil(this.unsubscribe)
    ).subscribe((streamSub) => {
      this.isLoadingChannels = false;
      this.setActiveSteams(streamSub?.streams!, streamSub?.action);
    });
  }

  /**
   * Handles the adding and removing of twitch streams from
   * the list in the UI. 
   * 
   * @param streamData the list of ActiveStreams.
   * @param streamAction Whether to Add or Remove them.
   */
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
      autoFocus: false,
      data: {
        existingChatRooms: [...this.storedRooms]
      }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {  
      if (!result) return;
      
      const {newRoom} = result;
      if (newRoom) {
        this.selectedRoom = newRoom;
        this.changeRoom(newRoom);
      }
    });
  }

  /**
   * When the user opens the menu by clicking the trigger
   * we need to resize the material menu to be the same width
   * as the input. 
   */
  prepareMenu(): void {
		setTimeout(() => {
			// Set the width of the menu to the width of the fake select input
			const triggerEle = (this.menuTrigger as any)._viewContainerRef.element.nativeElement;
			const menu = document.getElementById(this.menuTrigger.menu?.panelId!);
			menu?.setAttribute('style', `width:${triggerEle?.offsetWidth}px !important`);
		}, 0);
	}

  /**
   *  Navigates to the current room by updating the query params
   * 
   * @param room The room we are switching to.
   * @param isTwitch Whether the room is a Twitch stream or not.
   */
  changeRoom(room?: string, isTwitch?: boolean): void {
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
