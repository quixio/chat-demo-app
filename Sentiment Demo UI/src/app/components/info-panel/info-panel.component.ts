import { Component, OnInit } from '@angular/core';
import { QuixService } from 'src/app/services/quix.service';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit {
  
  workspaceId: string;

  constructor(private quixService: QuixService) { 
    this.workspaceId = this.quixService.workspaceId;
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
}
