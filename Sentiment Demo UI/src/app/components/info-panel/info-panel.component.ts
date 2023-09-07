import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit {
  
  constructor() { 
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
