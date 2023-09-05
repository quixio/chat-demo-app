import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, skip, takeUntil, tap } from 'rxjs';
import { ConnectionStatus, QuixService } from 'src/app/services/quix.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  private unsubscribe$ = new Subject<void>();

  constructor(private quixService: QuixService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.pipe(
      tap((params) => {
        const {room} = params;
        this.quixService.selectedRoom = room || 'Quix chatroom';
      }),
      skip(1),
      takeUntil(this.unsubscribe$)).subscribe(params => {
      console.log('PARAMS', params);
      const {room} = params;
      this.quixService.subscribeToRoom(room);
    });

     // Listen for connection status changes
     this.quixService.readerConnStatusChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((status) => {
      if (status === ConnectionStatus.Connected) {
        console.log('Subscribing');

        this.quixService.subscribeToRoom(this.quixService.selectedRoom);
        
        // this.quixService.subscribeToParameter(this.quixService.messagesTopic, 'test', "*");
        // this.quixService.subscribeToParameter(this.quixService.draftsTopic, 'test', "*");
        // this.quixService.subscribeToParameter(this.quixService.sentimentTopic, 'test', "*");
        // this.quixService.subscribeToParameter(this.quixService.draftsSentimentTopic, 'test', "*");
      } 
    });
  }

  ngOnDestroy(): void {
    // this.quixService.unsubscribeFromParameter(this.quixService.sentimentTopic, 'test', "*");
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
