import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  constructor() { 
  }

  ngOnInit(): void {
  }

  /**
   * 
   */
  scrollToChat(): void {
    const chatEle = document.getElementById('chat-section');
    chatEle?.scrollIntoView({
      behavior: 'smooth'
    })
  }

}
