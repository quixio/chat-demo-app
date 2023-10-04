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

	/**
	 * Listens to the actives streams changing and emitting it to
	 * any components listening.
	 */
	public activeStreamsChanged(): void {
		// console.log(`Twitch Service | Listen for channels changing`);
		this.quixService.readerHubConnection.on('ActiveStreamsChanged', (stream: ActiveStream, action?: ActiveStreamAction) => {
			this._activeChannels.next({ streams: [stream], action });
		});
	}

	/**
	 * Subscribes to all the active streams on the message topic.
	 * This will be all the Twitch streams.
	 */
  public subscribeToChannels(): void {
    // console.log(`Twitch Service | Subscribing to retrieve channels`);
    this.quixService.readerHubConnection
			.invoke('SubscribeToActiveStreams', this.quixService.twitchMessagesTopic)
			.then((stream: ActiveStream, action?: ActiveStreamAction) => {
				if (!stream) return;
				const streamsArray = Array.isArray(stream) ? stream : [stream];
				this._activeChannels.next({ streams: streamsArray, action });
			})
  }

	/**
	 * Unsubscribes from all the active streams on the message topic. 
	 */
	public unsubscribeFromChannels(): void { 
		// console.log(`Twitch Service | Unsubscribing from retrieve channels`);
		this.quixService.readerHubConnection
			.invoke('UnsubscribeFromActiveStreams', this.quixService.twitchMessagesTopic)
			.then(() => {
				this._activeChannels.next({ streams: [], action: ActiveStreamAction.Remove });
			})
	}

	public getActiveStreams$(): Observable<ActiveStreamSubscription | undefined> {
		return this._activeChannels?.asObservable() || of();
	}

}
