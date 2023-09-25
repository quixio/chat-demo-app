import { Component } from '@angular/core';
import { QuixService } from './services/quix.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent{

  workspaceId: string;

  constructor(private quixService: QuixService) {
    this.workspaceId = this.quixService.workspaceId;
  }
}