import { Component, Input, OnInit } from '@angular/core';
import { NEGATIVE_THRESHOLD, POSITIVE_THRESHOLD } from '../web-chat/web-chat.component';
import { MessagePayload } from 'src/app/models/messagePayload';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  @Input() message: MessagePayload;

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * Takes the sentiment value of a message and returns the
   * appropriate icon to be rendered in the template.
   * 
   * @param sentiment The sentiment of the message.
   * @returns The icon name.
   */
  public getSentimentIcon(sentiment: number): string | undefined {
    if (sentiment > POSITIVE_THRESHOLD) {
      return 'sentiment_satisfied';
    } else if (sentiment < NEGATIVE_THRESHOLD) {
      return 'sentiment_dissatisfied';
    } else if (sentiment === 0) {
      return 'sentiment_neutral';
    }
      
    return undefined;
  }

  /**
   * Takes the sentiment value of a message and returns the
   * appropriate color to be rendered in the template.
   * 
   * @param sentiment The sentiment of the message.
   * @returns The Html class.
   */
  public getColor(sentiment: number): string {
    if (sentiment > POSITIVE_THRESHOLD) {
      return 'text-success';
    } else if (sentiment < NEGATIVE_THRESHOLD) {
      return 'text-danger';
    } 
   
    return 'text-grey-light';
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
}
