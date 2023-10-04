import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { QuixService } from 'src/app/services/quix.service';
import { RoomService } from 'src/app/services/room.service';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit, OnDestroy {
  
  workspaceId: string;
  ungatedToken: string;
  deploymentId: string;

  private unsubscribe$ = new Subject<void>();

  constructor(private quixService: QuixService, private roomService: RoomService) { 
    this.workspaceId = this.quixService.workspaceId;
    this.ungatedToken = this.quixService.ungatedToken;
   
    // Listen for the room change to determine whether its a twitch stream or not, 
    // if so then we point to the twitch sentiment deployment.
    this.roomService.roomChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe(({ isTwitch }) => {
      this.deploymentId = isTwitch ? this.quixService.twitchSentimentAnalysisDeploymentId : this.quixService.sentimentAnalysisDeploymentId
    });
  }

  ngOnInit(): void {
  }

  /**
   * Only needed for mobile users.
   * Scrolls the chat section into view.
   */
  scrollToChat(): void {
    const chatEle = document.getElementById('chat-section');
    chatEle?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
