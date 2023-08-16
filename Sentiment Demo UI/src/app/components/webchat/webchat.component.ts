import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { Chart, ChartDataset, ChartOptions, Legend, LinearScale, LineController, LineElement, PointElement } from 'chart.js';
import 'chartjs-adapter-luxon';
import ChartStreaming, { RealTimeScale } from 'chartjs-plugin-streaming';
import { Subject, Subscription, debounceTime, takeUntil, timer } from 'rxjs';
import { MessagePayload } from 'src/app/models/messagePayload';
import { ParameterData } from 'src/app/models/parameterData';
import { ConnectionStatus, QuixService } from '../../services/quix.service';
import { TitleCasePipe } from '@angular/common';

export class UserTyping {
  timeout?: Subscription;
  sentiment?: number;
}

@Component({
  selector: 'app-webchat',
  templateUrl: './webchat.component.html',
  styleUrls: ['./webchat.component.scss'],
  providers: [TitleCasePipe]
})
export class WebchatComponent implements OnInit, OnDestroy {
  @ViewChild('chatWrapper') chatWrapper: ElementRef<HTMLElement>;
  @ViewChild('myChart') myChart: Chart;

  connectionState = ConnectionStatus;
  readerConnectionStatus: ConnectionStatus = ConnectionStatus.Offline;
  writerConnectionStatus: ConnectionStatus = ConnectionStatus.Offline;

  ngxQrcodeElementTypes = NgxQrcodeElementTypes;
  ngxQrcodeErrorCorrectionLevels = NgxQrcodeErrorCorrectionLevels
  qrValue: string;

  messages: MessagePayload[] = [];

  usersTyping: Map<string, UserTyping> = new Map();
  typingTimeout: number = 4000;
  typingDebounce: number = 300;
  messageSent: string | undefined;
  draftGuid: string | undefined;

  room: string;
  name: string;
  phone: string;
  email: string;

  messageFC = new FormControl("");
  chatForm = new FormGroup({
    message: this.messageFC,
  });

  datasets: ChartDataset[] = [{
    data: [],
    label: 'Chatroom sentiment',
    borderColor: '#0064ff',
    backgroundColor: 'rgba(0, 100, 255, 0.24)',
    pointBackgroundColor: 'white',
    pointBorderColor: 'black',
    pointBorderWidth: 2,
    fill: true
  }];

  options: ChartOptions = {
    interaction: {
      mode: 'index',
      intersect: false
    },
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: {
        type: 'linear',
        max: 1,
        min: -1
      },
      x: {
        type: 'realtime',
        realtime: {
          duration: 20000,
          refresh: 1000,
          delay: 200,
          onRefresh: (chart: Chart) => {
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  private unsubscribe$ = new Subject<void>();

  constructor(private quixService: QuixService, private route: ActivatedRoute, private titleCasePipe: TitleCasePipe) {
    Chart.register(
      LinearScale,
      LineController,
      PointElement,
      LineElement,
      RealTimeScale,
      Legend,
      ChartStreaming
    );
  }

  ngOnInit() {
    // Get the parameter data from the route
    const paramMap = this.route.snapshot.paramMap;
    this.room = paramMap.get('room') || '';
    this.name = paramMap.get('name') || '';
    this.phone = paramMap.get('phone') || '';
    this.email = paramMap.get('email') || '';

    this.messageFC.valueChanges.pipe(debounceTime(300), takeUntil(this.unsubscribe$)).subscribe((value) => {
      // Prevents it triggering when they send message and debounce is triggered
      if (this.messageSent === value) {
        this.messageSent = undefined;
        return;
      }
      
      // Generate a new GUID if there isn't one already or if they clear the input
      if (!this.draftGuid || value === '') this.draftGuid = this.generateGUID();
      
      this.sendMessage(true);
    });

    // Listen for connection status changes
    this.quixService.readerConnStatusChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((status) => {
      this.readerConnectionStatus = status;
      if (status === ConnectionStatus.Connected) this.subscribeToParams();
    });
    this.quixService.writerConnStatusChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((status) => {
      this.writerConnectionStatus = status
    });

    // Listen for reader messages
    this.quixService.paramDataReceived$.pipe(takeUntil(this.unsubscribe$)).subscribe((payload) => {
      // console.log("Component - Payload Recieved", x);
      this.messageReceived(payload);
    });
  }

  public submit() {
    this.sendMessage(false);
    this.messageSent = this.messageFC.value!;
    this.messageFC.reset("", { emitEvent: false });
  }

  private sendMessage(isDraft: boolean): void {
    const message: string = this.messageFC.value || "";
    if (!isDraft) this.draftGuid = undefined;

    const payload = {
      timestamps: [new Date().getTime() * 1000000],
      tagValues: {
        room: [this.room],
        role: ['Customer'],
        name: [this.name],
        phone: [this.phone],
        email: [this.email],
        draft_id: [this.draftGuid]
      },
      stringValues: {
        "chat-message": [message],
      }
    };

    this.quixService.sendMessage(this.room, payload, isDraft);
  }

  private subscribeToParams() {
    this.quixService.subscribeToParameter(this.quixService.messagesTopic, this.room, "*");
    this.quixService.subscribeToParameter(this.quixService.draftsTopic, this.room, "*");
    this.quixService.subscribeToParameter(this.quixService.sentimentTopic, this.room, "*");
    this.quixService.subscribeToParameter(this.quixService.draftsSentimentTopic, this.room, "*");

    let host = window.location.host;
    this.qrValue = `${window.location.protocol}//${host}/lobby?room=${this.room}`;

    this.quixService.getLastMessages(this.room).subscribe(lastMessage => {
      this.messages = lastMessage.slice(Math.max(0, lastMessage.length - 20), lastMessage.length);

      const el = this.chatWrapper.nativeElement;
      setTimeout(() => el.scrollTop = el.scrollHeight);
    });
  }

  private messageReceived(payload: ParameterData): void {
    
    console.log("Receiving parameter data - ", payload);

    let topicId = payload.topicId;
    let [timestamp] = payload.timestamps;
    let [name] = payload.tagValues["name"];
    let sentiment = payload.numericValues["sentiment"]?.at(0) || 0;
    let averageSentiment = payload.numericValues["average_sentiment"]?.at(0) || 0;
    let message = this.messages.find((f) => f.timestamp === timestamp && f.name === name);
    let user = this.usersTyping.get(name);


    if (topicId === this.quixService.draftsTopic) {
      const timer$ = timer(3000);
      // If they were already tying
      if (user) this.usersTyping.get(name)?.timeout?.unsubscribe();
      // When it finishes, removes the user from typing list
      const subscription = timer$.subscribe(() => this.usersTyping.delete(name));
      // Add the subscription to the object
      this.usersTyping.set(name, {
        ...user,
        timeout: subscription
      });
    }

    if (topicId === this.quixService.draftsSentimentTopic) {
      if (!user) return;
      user = { ...user, sentiment };
      this.usersTyping.set(name, user);
    }

    if (topicId === this.quixService.messagesTopic) {
       // If the user is in the typing map then remove them
       if (user) {
        user?.timeout?.unsubscribe();
         this.usersTyping.delete(name);
       } 
       // Push the new message
       this.messages.push({timestamp, name, sentiment, value: payload.stringValues["chat-message"]?.at(0)});
    }

    if (topicId === this.quixService.sentimentTopic) {
      if (!message) return;
      // Update existing message with the sentiment
      message.sentiment = sentiment;
    }
 
    // Update chart with the average sentiment
    if (averageSentiment) {
      let row = { x: timestamp / 1000000, y: averageSentiment };
      this.datasets[0].data.push(row as any);
    }

    // Scroll to the button of the chart
    const el = this.chatWrapper.nativeElement;
    const isScrollToBottom = el.offsetHeight + el.scrollTop >= el.scrollHeight;
    if (isScrollToBottom) setTimeout(() => (el.scrollTop = el.scrollHeight));
  }

  /**
   * Based on how many users are typing, it generates the appropriate
   * isTyping message to be displayed in the template.
   * 
   * @returns The Html message.
   */
  public getTypingMessage(): string | undefined {  
    const users = Array.from(this.usersTyping.entries())
    .filter(([key]) => this.name !== key)
    .map(([key, value]) => ({
      name: this.titleCasePipe.transform(key),
      sentiment: value.sentiment!,
    }));

    if (users.length === 1) {
      const [user] = users;
      return `${this.getNameHtml(user)} is Typing`;
    } else if (users.length > 1) {
      const lastUser = users.pop()!;
      const allUsersHtml = users.map(user => this.getNameHtml(user)).join(", ");
      const lastUserHtml = this.getNameHtml(lastUser);
      return `${allUsersHtml} and ${lastUserHtml} are typing...`;
    } else {
      return undefined;
    }
  }

  /**
   * Takes the name and sentiment and creates a span with the
   * appropriate color.
   * @param name The name of the user.
   * @param sentiment The sentiment of the message.
   * @returns The Html span with the correct color.
   */
  private getNameHtml({ name, sentiment}: { name: string, sentiment: number }) {
    const color = this.getColor(sentiment);
    return `<span class="${color}">${name}</span>`;
  }

  /**
   * Takes the sentiment value of a message and returns the
   * appropriate color to be rendered in the template.
   * 
   * @param sentiment The sentiment of the message.
   * @returns The Html class.
   */
  private getColor(sentiment: number): string {
    const POSITIVE_THRESHOLD = 0.5;
    const NEGATIVE_THRESHOLD = -0.5;
    
    if (sentiment > POSITIVE_THRESHOLD) {
      return 'text-success';
    } else if (sentiment < NEGATIVE_THRESHOLD) {
      return 'text-danger';
    } else if (sentiment < POSITIVE_THRESHOLD && sentiment > NEGATIVE_THRESHOLD) {
      return 'text-grey';
    } else {
      return 'text-grey-light';
    }
  }

  /**
   * Takes the date timestamp, divides it by 1000000
   * and then creates a JS date from it to be used in the template.
   * 
   * @param timestamp The date timestamp.
   * @returns The new Date. 
   */
  public getDateFromTimestamp(timestamp: number) {
    return new Date(timestamp / 1000000)
  }

  /**
   * Util method for generating a v4 GUID.
   * 
   * @returns The generated GUID.
   */
  private generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
  }

  ngOnDestroy(): void {
     // Unsubscribe from all the parameters
     this.quixService.unsubscribeFromParameter(this.quixService.messagesTopic, this.room, "*");
     this.quixService.unsubscribeFromParameter(this.quixService.draftsTopic ,this.room, "*");
     this.quixService.unsubscribeFromParameter(this.quixService.sentimentTopic, this.room, "*");
     this.quixService.unsubscribeFromParameter(this.quixService.draftsSentimentTopic, this.room, "*");
  }
}