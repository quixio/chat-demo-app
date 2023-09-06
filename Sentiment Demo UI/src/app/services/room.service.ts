import { Injectable } from "@angular/core";
import { QuixService } from "./quix.service";
import { Observable, ReplaySubject, Subject, of } from "rxjs";
import { MessagePayload } from "../models/messagePayload";

export const QuixChatRoom = 'Quix chatroom';

class RoomChange {
  roomId: string;
  isTwitch: boolean;
}

@Injectable({
  providedIn: "root",
})
export class RoomService {
  selectedRoom: string;
  isTwitch: boolean;

  private _roomChanged$ = new Subject<RoomChange>();
  private _previousRooms: string[] = [];
  private _previousRooms$ = new ReplaySubject<string[]>;

  constructor(private quixService: QuixService) {
    this.retrievePreviousRooms();
  }

  private retrievePreviousRooms(): void {
    const localStorageValue = localStorage.getItem('rooms');
    localStorageValue ? JSON.parse(localStorageValue) : [];
    this._previousRooms = localStorageValue ? JSON.parse(localStorageValue) : [];
    this._previousRooms$.next(this._previousRooms);
  }

  private setPreviousRooms(): void {
    localStorage.setItem('rooms', JSON.stringify(this._previousRooms));
    this._previousRooms$.next(this._previousRooms);
  }

  public switchRoom(roomName?: string, isTwitchRoom?: boolean): void {
    this.isTwitch = !!isTwitchRoom;

    if (roomName && !isTwitchRoom && !this._previousRooms.includes(roomName)) {
      this._previousRooms.push(roomName);
      this.setPreviousRooms();
    }

    roomName = roomName || QuixChatRoom;

    // Unsubscribe from previous room
    if (this.selectedRoom) this.unsubscribeFromRoom(this.selectedRoom)

    // Subscribe to the new room
    this.subscribeToRoom(roomName);

    // Perform room logic
    this.selectedRoom = roomName;
    this._roomChanged$.next({ roomId: this.selectedRoom, isTwitch: this.isTwitch });
  }

  public sendMessage(payload: any, isDraft?: boolean) {
    const topic = isDraft ? this.quixService.draftsTopic : this.quixService.messagesTopic;
    this.quixService.sendParameterData(topic, this.selectedRoom, payload);
  }

  public getLastMessages(room: string): Observable<MessagePayload[]> {
    let payload =
    {
      'numericParameters': [
        {
          'parameterName': 'sentiment',
          'aggregationType': 'None'
        },
        {
          'parameterName': 'average_sentiment',
          'aggregationType': 'None'
        }
      ],
      'stringParameters': [
        {
          'parameterName': 'chat-message',
          'aggregationType': 'None'
        }
      ],

      'streamIds': [
        room + '-output'
      ],
      'groupBy': [
        'role',
        'name'
      ],
    };
    return this.quixService.retrievePersistedParameterData(payload);
  }

  public subscribeToRoom(roomName: string): void {
    // console.log('subscribing from', roomName);
    this.quixService.subscribeToParameter(this.quixService.messagesTopic, roomName, "*");
    this.quixService.subscribeToParameter(this.quixService.draftsTopic, roomName, "*");
    this.quixService.subscribeToParameter(this.quixService.sentimentTopic, roomName, "*");
    this.quixService.subscribeToParameter(this.quixService.draftsSentimentTopic, roomName, "*");
  }

  public unsubscribeFromRoom(roomName: string): void {
    // console.log('unsubscribing from', roomName);
    this.quixService.unsubscribeFromParameter(this.quixService.messagesTopic, roomName, "*");
    this.quixService.unsubscribeFromParameter(this.quixService.draftsTopic, roomName, "*");
    this.quixService.unsubscribeFromParameter(this.quixService.sentimentTopic, roomName, "*");
    this.quixService.unsubscribeFromParameter(this.quixService.draftsSentimentTopic, roomName, "*");

  }

  get roomChanged$() {
    return this._roomChanged$.asObservable();
  }

  get previousRooms$(): Observable<string[] | undefined> {
    return this._previousRooms$.asObservable() || of();
  }
}
