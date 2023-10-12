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

  // deployment id's for the PROD deployments. used by links in the info panel.
  public sentimentAnalysisDeploymentId: string = "64aa05e9-b8d7-41d0-89d9-8c7996bd3a15"; // links from the info text in the left hand panel use this to link you to the project in the platform. Easier to leave it blank.
  public twitchSentimentAnalysisDeploymentId: string = "bcab2636-5092-4ea7-920f-f921c2cbae0f"; // links from the info text in the left hand panel use this to link you to the project in the platform. Easier to leave it blank.
  
  private unsubscribe$ = new Subject<void>();

  constructor(private quixService: QuixService, private roomService: RoomService) { 
    this.deploymentId = this.sentimentAnalysisDeploymentId; // default to this
    this.workspaceId = this.quixService.workspaceId;
    this.ungatedToken = this.quixService.ungatedToken;
   
    // Listen for the room change to determine whether its a twitch stream or not, 
    // if so then we point to the twitch sentiment deployment.
    this.roomService.roomChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe(({ isTwitch }) => {
      this.deploymentId = isTwitch ? this.twitchSentimentAnalysisDeploymentId : this.sentimentAnalysisDeploymentId
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
