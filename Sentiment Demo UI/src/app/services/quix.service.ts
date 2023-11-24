import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, IHttpConnectionOptions } from '@microsoft/signalr';
import { combineLatest, Observable, Subject } from 'rxjs';
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
  // this is the token that will authenticate the user into the ungated product experience.
  // ungated means no password or login is needed.
  // the token is locked down to the max and everything is read only.
  public ungatedToken: string = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1qVTBRVE01TmtJNVJqSTNOVEpFUlVSRFF6WXdRVFF4TjBSRk56SkNNekpFUWpBNFFqazBSUSJ9.eyJodHRwczovL3F1aXguYWkvb3JnX2lkIjoiZGVtbyIsImh0dHBzOi8vcXVpeC5haS9vd25lcl9pZCI6ImF1dGgwfDI4YWQ4NWE4LWY1YjctNGFjNC1hZTVkLTVjYjY3OGIxYjA1MiIsImh0dHBzOi8vcXVpeC5haS90b2tlbl9pZCI6ImMzNzljNmVlLWNkMmYtNDExZC1iOGYyLTMyMDU0ZDc5MTY2YSIsImh0dHBzOi8vcXVpeC5haS9leHAiOiIxNzM3ODI5NDc5LjIyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC5xdWl4LmFpLyIsInN1YiI6ImtyMXU4MGRqRllvUUZlb01nMGhqcXZia29lRkxFRDVBQGNsaWVudHMiLCJhdWQiOiJxdWl4IiwiaWF0IjoxNjk1NzE2MDI4LCJleHAiOjE2OTgzMDgwMjgsImF6cCI6ImtyMXU4MGRqRllvUUZlb01nMGhqcXZia29lRkxFRDVBIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwicGVybWlzc2lvbnMiOltdfQ.Ndm0K2iNHPxDq1ohF-yb-6LzIqx_UY8Ptcq0kAwSNye12S3deX_eDkC4XqZqW2NoSLd3GsmWV9PZGetGGp2IlqshQFZtUMp6WP6hq917ZC1i8JFx93PAbY7NT_88nFDovVlaRcoTpWvI-03KbryLkAoB28c6qb3EFwjCWFBuy_yA4yjQ8uF0-AZ0R9Qi4IBaekXWqcgO0a91gVRg0oA_hnzJFoR-EnZ2G1ZSxtuVgnyyPuQTMUvzJuUT_IJTLzEB_kejX0pcXRZBIwHP8MWLB4mE5DtIdz4jm8WIA4eZJZ7ZCG4dk-adQwZ2BdkNknV5eEwRgRJL4ybaplkaDlR-dg';

  /*~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-*/
  /*WORKING LOCALLY? UPDATE THESE!*/
  private workingLocally = false; // set to true if working locally
  private token: string = ''; // Create a token in the Tokens menu and paste it here
  public workspaceId: string = 'demo-chatappdemo-prod'; // Look in the URL for the Quix Portal your workspace ID is after 'workspace='
  public messagesTopic: string = 'chat-messages'; // get topic name from the Topics page
  public twitchMessagesTopic: string = 'twitch-messages'; // get topic name from the Topics page
  public draftsTopic: string = 'drafts'; // get topic from the Topics page
  public sentimentTopic: string = 'chat-with-sentiment'; // get topic name from the Topics page
  public draftsSentimentTopic: string = 'drafts_sentiment'; // get topic name from the Topics page
  /*~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-*/
  
  private subdomain = 'platform'; // leave as 'platform'
  readonly server = ''; // leave blank

  public sentimentAnalysisDeploymentId: string = "64aa05e9-b8d7-41d0-89d9-8c7996bd3a15"; // links from the info text in the left hand panel use this to link you to the project in the platform. Easier to leave it blank.
  public twitchSentimentAnalysisDeploymentId: string = "bcab2636-5092-4ea7-920f-f921c2cbae0f"; // links from the info text in the left hand panel use this to link you to the project in the platform. Easier to leave it blank.

  private readerReconnectAttempts: number = 0;
  private writerReconnectAttempts: number = 0;
  private reconnectInterval: number = 5000;
  private hasReaderHubListeners: boolean = false;

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
    "^https:\\/\\/portal-api\\.([a-zA-Z]+)\\.quix\\.io"
  );

  constructor(private httpClient: HttpClient) {

    if(this.workingLocally || location.hostname === "localhost" || location.hostname === "127.0.0.1"){
      this.messagesTopic = this.workspaceId + '-' + this.messagesTopic;
      this.twitchMessagesTopic = this.workspaceId + '-' + this.twitchMessagesTopic;
      this.draftsTopic = this.workspaceId + '-' + this.draftsTopic;
      this.sentimentTopic = this.workspaceId + '-' + this.sentimentTopic;
      this.draftsSentimentTopic = this.workspaceId + '-' + this.draftsSentimentTopic;
      this.setUpHubConnections(this.workspaceId);
    }
    else {
      const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
      let bearerToken$ = this.httpClient.get(this.server + "bearer_token", {headers, responseType: 'text'});
      let workspaceId$ = this.httpClient.get(this.server + 'workspace_id', {headers, responseType: 'text'});
      let messagesTopic$ = this.httpClient.get(this.server + 'messages_topic', {headers, responseType: 'text'});
      let twitchMessagesTopic$ = this.httpClient.get(this.server + 'twitch_messages_topic', {headers, responseType: 'text'});

      let draftTopic$ = this.httpClient.get(this.server + 'drafts_topic', {headers, responseType: 'text'});
      let sentimentTopic$ = this.httpClient.get(this.server + 'sentiment_topic', {headers, responseType: 'text'});
      let draftsSentimentTopic$ = this.httpClient.get(this.server + 'drafts_sentiment_topic', {headers, responseType: 'text'});
      let portalApi$ = this.httpClient.get(this.server + "portal_api", {headers, responseType: 'text'})

      let value$ = combineLatest([
        // General
        bearerToken$,
        workspaceId$,
        portalApi$,

        // Topics
        messagesTopic$,
        twitchMessagesTopic$,
        draftTopic$,
        sentimentTopic$,
        draftsSentimentTopic$,

      ]).pipe(map(([bearerToken, workspaceId,  portalApi, messagesTopic, twitchMessagesTopic, draftTopic, sentimentTopic, draftsSentimentTopic]) => {
        return {bearerToken, workspaceId, portalApi, messagesTopic, twitchMessagesTopic, draftTopic, sentimentTopic, draftsSentimentTopic};
      }));

      value$.subscribe(({ bearerToken, workspaceId, portalApi, messagesTopic, twitchMessagesTopic, draftTopic, sentimentTopic, draftsSentimentTopic }) => {
        this.token = this.stripLineFeed(bearerToken);
        this.workspaceId = this.stripLineFeed(workspaceId);
        this.messagesTopic = this.stripLineFeed(this.workspaceId + '-' + messagesTopic);
        this.twitchMessagesTopic = this.stripLineFeed(this.workspaceId + '-' + twitchMessagesTopic);
        this.draftsTopic = this.stripLineFeed(this.workspaceId + '-' + draftTopic);
        this.sentimentTopic = this.stripLineFeed(this.workspaceId + '-' + sentimentTopic);
        this.draftsSentimentTopic = this.stripLineFeed(this.workspaceId + '-' + draftsSentimentTopic);

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

    this.readerHubConnection = this.createHubConnection(`https://reader-${workspaceId}.${this.subdomain}.quix.io/hub`, options, true);
    this.startConnection(true, this.readerReconnectAttempts);
  
    this.writerHubConnection = this.createHubConnection(`https://writer-${workspaceId}.${this.subdomain}.quix.io/hub`, options, false);
    this.startConnection(false, this.writerReconnectAttempts);
  }

  /**
   * Creates a new hub connection.
   * 
   * @param url The url of the SignalR connection.
   * @param options The options for the hub.
   * @param isReader Whether it's the ReaderHub or WriterHub.
   *
   * @returns The newly created hub connection.
   */
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

  /**
   * Handles the initial logic of starting the hub connection. If it falls
   * over in this process then it will attempt to reconnect.
   * 
   * @param isReader Whether it's the ReaderHub or WriterHub.
   * @param reconnectAttempts The number of attempts to reconnect.
   */
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
          if (isReader && !this.hasReaderHubListeners) {
            this.setupReaderHubListeners(hubConnection);
            this.hasReaderHubListeners = true;
          }
        })
        .catch(err => {
          console.error(`QuixService - ${hubName} | Error while starting connection!`, err);
          subject.next(ConnectionStatus.Reconnecting)
          this.tryReconnect(isReader, reconnectAttempts);
        });
    }
  }

  /**
   * Creates listeners on the ReaderHub connection for both parameters
   * and events so that we can detect when something changes. This can then
   * be emitted to any components listening.
   * 
   * @param readerHubConnection The readerHubConnection we are listening to.
   */
  private setupReaderHubListeners(readerHubConnection: HubConnection): void {
    // Listen for parameter data and emit
    readerHubConnection.on("ParameterDataReceived", (payload: ParameterData) => {
      this.paramDataReceived.next(payload);
    });
    
    // Listen for event data and emit
    readerHubConnection.on("EventDataReceived", (payload: EventData) => {
      this.eventDataReceived.next(payload);
    });
  }

  /**
   * Handles the reconnection for a hub connection. Will continiously
   * attempt to reconnect to the hub when the connection drops out. It does
   * so with a timer of 5 seconds to prevent a spam of requests and gives it a
   * chance to reconnect.
   * 
   * @param isReader Whether it's the ReaderHub or WriterHub.
   * @param reconnectAttempts The number of attempts to reconnect.
   */
  private tryReconnect(isReader: boolean, reconnectAttempts: number) {
    const hubName = isReader ? 'Reader' : 'Writer';
      reconnectAttempts++;
      setTimeout(() => {
        console.log(`QuixService - ${hubName} | Attempting reconnection... (${reconnectAttempts})`);
        this.startConnection(isReader, reconnectAttempts)
      },this.reconnectInterval);
   
  }

  /**
   * Subscribes to a parameter on the ReaderHub connection so
   * we can listen to changes.
   * 
   * @param topic The topic being wrote to.
   * @param streamId The id of the stream.
   * @param parameterId The parameter want to listen for changes.
   */
  public subscribeToParameter(topic: string, streamId: string, parameterId: string) {
    // console.log(`QuixService Reader | Subscribing to parameter - ${topic}, ${streamId}, ${parameterId}`);
    this.readerHubConnection.invoke("SubscribeToParameter", topic, streamId, parameterId);
  }

  /**
   * Unsubscribe from a parameter on the ReaderHub connection
   * so we no longer recieve changes.
   * 
   * @param topic 
   * @param streamId 
   * @param parameterId 
   */
  public unsubscribeFromParameter(topic: string, streamId: string, parameterId: string) {
    // console.log(`QuixService Reader | Unsubscribing from parameter - ${topic}, ${streamId}, ${parameterId}`);
    this.readerHubConnection.invoke("UnsubscribeFromParameter", topic, streamId, parameterId);
  }

  /**
   * Sends parameter data to Quix using the WriterHub connection.
   * 
   * @param topic The name of the topic we are writing to.
   * @param streamId The id of the stream.
   * @param payload The payload of data we are sending.
   */
  public sendParameterData(topic: string, streamId: string, payload: any): void {
    // console.log("QuixService Sending parameter data!", topic, streamId, payload);
    this.writerHubConnection.invoke("SendParameterData", topic, streamId, payload);
  }


  /**
   * Uses the telemetry data api to retrieve persisted parameter
   * data for a specific criteria.
   * 
   * @param payload The payload that we are querying with.
   * @returns The persisted parameter data.
   */
  public retrievePersistedParameterData(payload: any): Observable<ParameterData> {
    return this.httpClient.post<ParameterData>(
      `https://telemetry-query-${this.workspaceId}.${this.subdomain}.quix.io/parameters/data`,
      payload,
      {
        headers: { 'Authorization': 'bearer ' + this.token }
      }
    );
  }

  private stripLineFeed(s: string): string {
    return s.replace('\n', '');
  }

}

