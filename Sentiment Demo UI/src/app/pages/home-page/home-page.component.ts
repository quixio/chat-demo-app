import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, skip, takeUntil, tap } from 'rxjs';
import { ConnectionStatus, QuixService } from 'src/app/services/quix.service';
import { RoomService } from 'src/app/services/room.service';
import { TwitchService } from 'src/app/services/twitch.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  room: string;
  isTwitchRoom?: boolean;
  private unsubscribe$ = new Subject<void>();

  constructor(private roomService: RoomService, private quixService: QuixService, private twitchService: TwitchService,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.pipe(
        tap((params) => {
          const {room, twitchRoom} = params;
          this.isTwitchRoom = !!twitchRoom;
          this.room = room || twitchRoom;
        }),
        skip(1), // We don't want to trigger this the first time
        takeUntil(this.unsubscribe$)
      ).subscribe(() => {
      this.roomService.switchRoom(this.room, this.isTwitchRoom);
    });

     // Listen for connection status changes
     this.quixService.readerConnStatusChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((status) => {
      if (status === ConnectionStatus.Connected) {
        this.roomService.switchRoom(this.room, this.isTwitchRoom);

        this.twitchService.activeStreamsChanged();
        this.twitchService.subscribeToChannels();
      } 
    });
  }

  ngOnDestroy(): void {
    this.twitchService.unsubscribeFromChannels();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
