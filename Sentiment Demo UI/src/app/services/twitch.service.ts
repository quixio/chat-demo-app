import { Injectable } from '@angular/core';
import { QuixService } from './quix.service';
import { ActiveStream, ActiveStreamAction } from '../models/activeStream';
import { Observable, Subject, of } from 'rxjs';

interface ActiveStreamSubscription {
	streams?: ActiveStream[];
	action?: ActiveStreamAction | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class TwitchService {

	private _activeChannels = new Subject<ActiveStreamSubscription>;

  constructor(private quixService: QuixService) { 
	}

	public activateStreamsChanged(): void {
		this.quixService.readerHubConnection.on('ActiveStreamsChanged', (stream: ActiveStream, action?: ActiveStreamAction) => {
			this._activeChannels.next({ streams: [stream], action });
		});
	}

  public subscribeToChannels(): void {
    this.quixService.readerHubConnection
			.invoke('SubscribeToActiveStreams', this.quixService.messagesTopic)
			.then((stream: ActiveStream, action?: ActiveStreamAction) => {
				if (!stream) return;
				const streamsArray = Array.isArray(stream) ? stream : [stream];
				this._activeChannels.next({ streams: streamsArray, action });
			})
  }

	public unsubscribeFromChannels(): void { 
		this.quixService.readerHubConnection
			.invoke('UnsubscribeFromActiveStreams', this.quixService.messagesTopic)
			.then(() => {
				this._activeChannels.next({ streams: [], action: ActiveStreamAction.Remove });
			})
	}

	getActiveStreams$(): Observable<ActiveStreamSubscription | undefined> {
		return this._activeChannels?.asObservable() || of();
	}

}
