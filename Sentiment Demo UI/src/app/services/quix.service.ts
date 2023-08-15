import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, IHttpConnectionOptions } from '@microsoft/signalr';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessagePayload } from '../models/messagePayload';
import { ParameterData } from '../models/parameterData';
import { EventData } from '../models/eventData';

export enum ConnectionStatus {
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
  Offline = 'Offline'
}

@Injectable({
  providedIn: 'root'
})
export class QuixService {

  /*~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-*/
  /*WORKING LOCALLY? UPDATE THESE!*/
  private workingLocally = false; // set to true if working locally
  private token: string = ''; // Create a token in the Tokens menu and paste it here
  public workspaceId: string = 'demo-chatappdemo-istypingservice'; // Look in the URL for the Quix Portal your workspace ID is after 'workspace='
  public messagesTopic: string = 'messages'; // get topic name from the Topics page
  public draftsTopic: string = 'drafts'; // get topic from the Topics page
  public sentimentTopic: string = 'sentiment'; // get topic name from the Topics page
  public draftsSentimentTopic: string = 'drafts_sentiment'; // get topic name from the Topics page
  /*~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-*/

  private subdomain = 'platform'; // leave as 'platform'
  readonly server = ''; // leave blank

  private readerReconnectAttempts: number = 0;
  private writerReconnectAttempts: number = 0;
  private reconnectInterval: number = 5000;

  public readerHubConnection: HubConnection;
  public writerHubConnection: HubConnection;

  private readerConnStatusChanged = new Subject<ConnectionStatus>();
  readerConnStatusChanged$ = this.readerConnStatusChanged.asObservable();
  private writerConnStatusChanged = new Subject<ConnectionStatus>();
  writerConnStatusChanged$ = this.writerConnStatusChanged.asObservable();

  paramDataReceived = new Subject<ParameterData>();
  paramDataReceived$ = this.paramDataReceived.asObservable();

  eventDataReceived = new Subject<EventData>();
  eventDataReceived$ = this.eventDataReceived.asObservable();

  private domainRegex = new RegExp(
    "^https:\\/\\/portal-api\\.([a-zA-Z]+)\\.quix\\.ai"
  );

  constructor(private httpClient: HttpClient) {

    if(this.workingLocally){
      this.messagesTopic = this.workspaceId + '-' + this.messagesTopic;
      this.draftsTopic = this.workspaceId + '-' + this.draftsTopic;
      this.sentimentTopic = this.workspaceId + '-' + this.sentimentTopic;
      this.draftsSentimentTopic = this.workspaceId + '-' + this.draftsSentimentTopic;
      this.setUpHubConnections(this.workspaceId);
    }
    else {
      const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
      let workspaceId$ = this.httpClient.get(this.server + 'workspace_id', {headers, responseType: 'text'});
      let messagesTopic$ = this.httpClient.get(this.server + 'messages_topic', {headers, responseType: 'text'});
      let draftTopic$ = this.httpClient.get(this.server + 'drafts_topic', {headers, responseType: 'text'});
      let sentimentTopic$ = this.httpClient.get(this.server + 'sentiment_topic', {headers, responseType: 'text'});
      let draftsSentimentTopic$ = this.httpClient.get(this.server + 'drafts_sentiment_topic', {headers, responseType: 'text'});
      let token$ = this.httpClient.get(this.server + 'sdk_token', {headers, responseType: 'text'});
      let portalApi$ = this.httpClient.get(this.server + "portal_api", {headers, responseType: 'text'})

      let value$ = combineLatest([
        workspaceId$,
        messagesTopic$,
        draftTopic$,
        sentimentTopic$,
        draftsSentimentTopic$,
        token$,
        portalApi$
      ]).pipe(map(([workspaceId, messagesTopic, draftTopic, sentimentTopic, draftsSentimentTopic, token, portalApi]) => {
        return {workspaceId, messagesTopic, draftTopic, sentimentTopic, draftsSentimentTopic, token, portalApi};
      }));

      value$.subscribe(({ workspaceId, messagesTopic, draftTopic, sentimentTopic, draftsSentimentTopic, token, portalApi }) => {
        this.workspaceId = this.stripLineFeed(workspaceId);
        this.messagesTopic = this.stripLineFeed(this.workspaceId + '-' + messagesTopic);
        this.draftsTopic = this.stripLineFeed(this.workspaceId + '-' + draftTopic);
        this.sentimentTopic = this.stripLineFeed(this.workspaceId + '-' + sentimentTopic);
        this.draftsSentimentTopic = this.stripLineFeed(this.workspaceId + '-' + draftsSentimentTopic);
        this.token = token.replace('\n', '');

        portalApi = portalApi.replace("\n", "");
        let matches = portalApi.match(this.domainRegex);
        if(matches) {
          this.subdomain = matches[1];
        }
        else {
          this.subdomain = "platform"; // default to prod
        }

        this.setUpHubConnections(this.workspaceId);
      });
    }
  }

  private setUpHubConnections(workspaceId: string): void {
    const options: IHttpConnectionOptions = {
      accessTokenFactory: () => this.token,
    };

    this.readerHubConnection = this.createHubConnection(`https://reader-${workspaceId}.${this.subdomain}.quix.ai/hub`, options, true);
    this.startConnection(true, this.readerReconnectAttempts);
  
    this.writerHubConnection = this.createHubConnection(`https://writer-${workspaceId}.${this.subdomain}.quix.ai/hub`, options, false);
    this.startConnection(false, this.writerReconnectAttempts);
  }

  private createHubConnection(url: string, options: IHttpConnectionOptions, isReader: boolean): HubConnection {
    const hubConnection = new HubConnectionBuilder()
      .withUrl(url,options)
      .build();

    const hubName = isReader ? 'Reader' : 'Writer';
    hubConnection.onclose((error) => {
      console.log(`Quix Service - ${hubName} | Connection closed. Reconnecting... `, error);
      this.tryReconnect(isReader, isReader ? this.readerReconnectAttempts : this.writerReconnectAttempts);
    })
    return hubConnection;
  }

  private startConnection(isReader: boolean, reconnectAttempts: number): void {
    const hubConnection = isReader ? this.readerHubConnection : this.writerHubConnection;
    const subject = isReader ? this.readerConnStatusChanged : this.writerConnStatusChanged;
    const hubName = isReader ? 'Reader' : 'Writer';

    if (!hubConnection || hubConnection.state === 'Disconnected') {

      hubConnection.start()
        .then(() => {
          console.log(`QuixService - ${hubName} | Connection established!`);
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          subject.next(ConnectionStatus.Connected);

          // If it's reader hub connection then we create listeners for data
          if (isReader) this.setupReaderHubListeners(hubConnection);
        })
        .catch(err => {
          console.error(`QuixService - ${hubName} | Error while starting connection!`, err);
          subject.next(ConnectionStatus.Reconnecting)
          this.tryReconnect(isReader, reconnectAttempts);
        });
    }
  }

  private setupReaderHubListeners(hubConnection: HubConnection): void {
    // Listen for parameter data and emit
    hubConnection.on("ParameterDataReceived", (payload: ParameterData) => {
      this.paramDataReceived.next(payload);
    });
    
    // Listen for event data and emit
    hubConnection.on("EventDataReceived", (payload: EventData) => {
      this.eventDataReceived.next(payload);
    });
  }

  private tryReconnect(isReader: boolean, reconnectAttempts: number) {
    const hubName = isReader ? 'Reader' : 'Writer';
      reconnectAttempts++;
      setTimeout(() => {
        console.log(`QuixService - ${hubName} | Attempting reconnection... (${reconnectAttempts})`);
        this.startConnection(isReader, reconnectAttempts)
      },this.reconnectInterval);
   
  }

  public subscribeToParameter(topic: string, streamId: string, parameterId: string) {
    // console.log('QuixService Reader | Subscribing to parameter - ' + parameterId);
    this.readerHubConnection.invoke("SubscribeToParameter", topic, streamId, parameterId);
  }

  public unsubscribeFromParameter(topic: string, streamId: string, parameterId: string) {
    // console.log('QuixService Reader | Unsubscribing from parameter - ' + parameterId);
    this.readerHubConnection.invoke("UnsubscribeFromParameter", topic, streamId, parameterId);
  }
  
  public sendMessage(
    room: string,
    payload: any,
    isDraft?: boolean
  ) {
    const topic = isDraft ? this.draftsTopic : this.messagesTopic;
    console.log("QuixService Sending parameter data!", topic, room, payload);
    this.writerHubConnection.invoke(
      "SendParameterData",
      topic,
      room,
      payload
    );
  
  }

  private stripLineFeed(s: string): string {
    return s.replace('\n', '');
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

    return this.httpClient.post<ParameterData>(
      `https://telemetry-query-${this.workspaceId}.${this.subdomain}.quix.ai/parameters/data`,
      payload,
      {
        headers: { 'Authorization': 'bearer ' + this.token }
      }
    ).pipe(map(rows => {
      let result: MessagePayload[] = [];
      rows.timestamps.forEach((timestamp, i) => {
        result.push({
          timestamp,
          value: rows.stringValues['chat-message'][i],
          sentiment: rows.numericValues['sentiment'][i],
          name: rows.tagValues['name'][i]
        });
      })
      return result;
    }));
  }
}