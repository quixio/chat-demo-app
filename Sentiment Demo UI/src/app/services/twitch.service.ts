import { Injectable } from '@angular/core';
import { QuixService } from './quix.service';
import { ActiveStream, ActiveStreamAction } from '../models/activeStream';
import { BehaviorSubject, Observable, Subject, map, of } from 'rxjs';

interface ActiveStreamSubscription {
	streams?: ActiveStream[];
	action?: ActiveStreamAction | undefined;
}

export interface TwitchChannel {
	streamId?: string;
	game?: string;
	profilePic?: string;
	title?: string;
	viewerCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TwitchService {

	private _activeChannels = new Subject<ActiveStreamSubscription>;

	channels: TwitchChannel[];
	_channelsChanged$ = new BehaviorSubject<TwitchChannel[]>([]);

  constructor(private quixService: QuixService) { 

		// Listen for changes in the active streams and convert them to a list of Twitch channels.
		this.getActiveStreams$().subscribe((streamSub) => {
      this.setActiveSteams(streamSub?.streams!, streamSub?.action);
    });
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
			.catch((error) => {
				console.log(`Twitch Service | Error subscribing to retrieve channels`, error);
			});
  }

	/**
   * Handles the adding and removing of twitch streams from
   * the list in the UI. 
   * 
   * @param streamData the list of ActiveStreams.
   * @param streamAction Whether to Add or Remove them.
   */
	private setActiveSteams(streamData: ActiveStream[], streamAction?: ActiveStreamAction): void {
		// If streams is empty then ignore
			if (!streamData?.length) return;
			
			if (streamAction) {
				const [stream] = streamData;
				this.handleNewStreamAction(streamAction, stream);
			} else {
				const channels = streamData
					.filter((f) => f.streamId && f.metadata)
					.map((activeStream) => this.convertStreamToChannel(activeStream));
				this.channels = channels;
			}

			this._channelsChanged$.next([...this.channels]); // Create a new array to trigger the BehaviorSubject
		}

	/**
   * Handles when a new stream is added or removed.
   * 
   * @param streamAction The action we are performing.
   * @param streamData The data within the stream.
   */
	private handleNewStreamAction(streamAction: ActiveStreamAction, streamData: ActiveStream): void {
		if (streamAction === ActiveStreamAction.AddUpdate) {
			const isStreamExisting = this.channels.some((channel) => channel.streamId === streamData.streamId);
	
			if (!isStreamExisting) {
				const newStream = this.convertStreamToChannel(streamData);
				this.channels.push(newStream);
			}
		} else if (streamAction === ActiveStreamAction.Remove) {
			this.channels = this.channels.filter((channel) => channel.streamId !== streamData.streamId);
		}
	
		this._channelsChanged$.next([...this.channels]); // Create a new array to trigger the BehaviorSubject
  }

	/**
   * Converts the streamData into a Twitch channel extracting the
   * data from the metadata object.
   * 
   * @param streamData The streamData being converted.
   * @returns A new Twitch channel object.
   */
	private convertStreamToChannel(streamData: ActiveStream): TwitchChannel {
		const { metadata, streamId } = streamData;

		if (metadata && Object.keys(metadata).length) {
			const { game_name, thumbnail_url, title, viewer_count } = metadata;
			return {
				streamId,
				game: game_name,
				profilePic: this.convertProfilePic(thumbnail_url),
				title,
				viewerCount: parseInt(viewer_count, 10)
			};
		} else {
			return { streamId };
		}
	}

	/**
   * Takes the profile pic provided in the active stream and uses regex
   * to find and replace the height/width with preset values.
   * 
   * @param profilePicUrl The url of the twitch channel.
   * @returns An updated profile pic.
   */
	private convertProfilePic(profilePicUrl: string): string {
		const pictureDimension = "70"; // Same for both Height and Width
		return profilePicUrl.replace(/{width}|{height}/g, (match: string) => {
			return match === "{width}" ? pictureDimension :
						 match === "{height}" ? pictureDimension :
						 match;
		});
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

	private getActiveStreams$(): Observable<ActiveStreamSubscription | undefined> {
		return this._activeChannels?.asObservable() || of();
	}

	get channelsChanged$() {
    return this._channelsChanged$.asObservable();
  }

	/**
	 * Look up method to retrieve a specific TwitchChannel using the
	 * streamId.
	 * 
	 * @param streamId The streamId of the channel.
	 * @returns The Twitch Channel if its present in the list.
	 */
	public getTwitchChannel(streamId: string): Observable<TwitchChannel | undefined>{
		return this.channelsChanged$.pipe(
			map((channels) => channels.find((f) => streamId === f.streamId))
		)
	}

}
