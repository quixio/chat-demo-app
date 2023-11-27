import { Component, OnInit } from '@angular/core';
import { ConnectionStatus, QuixService } from './services/quix.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  workspaceId: string;
  ungatedToken: string;

  constructor(private quixService: QuixService) {
  }

  ngOnInit(): void {
    this.ungatedToken = this.quixService.ungatedToken;
    this.quixService.readerConnStatusChanged$.subscribe((status) => {
      if (status !== ConnectionStatus.Connected) return;
      this.workspaceId = this.quixService.workspaceId;
    });
  }
}