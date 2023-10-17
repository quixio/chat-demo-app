import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, Legend, LinearScale, LineController, LineElement, PointElement } from 'chart.js';
import ChartStreaming, { RealTimeScale } from 'chartjs-plugin-streaming';
import { Subject, Subscription, filter, take, takeUntil, throttleTime } from 'rxjs';
import { ParameterData } from 'src/app/models/parameter-data';
import { QuixService } from 'src/app/services/quix.service';
import { RoomService } from 'src/app/services/room.service';
import 'chartjs-adapter-luxon';

@Component({
  selector: 'app-sentiment-chart',
  templateUrl: './sentiment-chart.component.html',
  styleUrls: ['./sentiment-chart.component.scss']
})
export class SentimentChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sentimentChart', { static: true }) divView: ElementRef<HTMLCanvasElement>;
  chart: Chart;
  chartConfiguration: ChartConfiguration = {
    type: 'line',
    data: {
      datasets: [
        {
          data: [],
          label: 'Chatroom sentiment',
          borderColor: '#0064ff',
          backgroundColor: 'rgba(0, 100, 255, 0.24)',
          pointBackgroundColor: 'white',
          pointBorderColor: 'black',
          pointBorderWidth: 2,
          fill: true
        }
      ]
    },
    options: {
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
            duration: 300000,
            refresh: 1000,
            delay: 200
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      },
    }
  }
  isLoadingHistory: boolean = false;
  private historySubscription$ = new Subscription();

  private unsubscribe$ = new Subject<void>();
  
  constructor(private quixService: QuixService, private roomService: RoomService) { 
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

  ngOnInit(): void {
    // Listens for when a new data is received from the sentiment topic.
    this.quixService.paramDataReceived$
     .pipe(
      takeUntil(this.unsubscribe$), 
      filter((f) => !this.isLoadingHistory && f.topicId === this.quixService.sentimentTopic),
      throttleTime(5000) // reduce number of point just printing one every 5 seconds
      )
     .subscribe((payload) => {
      this.sentimentMessageReceived(payload);
    });

    // Listens for when the room changes and resets the chart
    this.roomService.roomChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe(({ roomId }) => {
      this.chartConfiguration.data.datasets!.at(0)!.data = [];
      this.loadPreviousSentiment(roomId);
    });
  }

  ngAfterViewInit(): void {
    // Get the context of the chart from the canvas
    const ctx = this.divView.nativeElement.getContext('2d');
		this.chart = new Chart(ctx!, this.chartConfiguration);
  }

  /**
   * Retrieves the previous sentiment for a specific chat room.
   */
  loadPreviousSentiment(roomId: string): void {
    // Ensure that we cancel the old one before creating new subscription
    if (this.historySubscription$) this.historySubscription$.unsubscribe();

    this.isLoadingHistory = true;
    this.historySubscription$ = this.roomService.getChatSentimentHistory(roomId).pipe(take(1)).subscribe({
      next: (sentiment) => {
        this.sentimentMessageReceived(sentiment);
      },
      complete: () => {
        this.isLoadingHistory = false;
      }
    })
  }

  /**
   * Converts the data from the payload so that it
   * can then be added to the chart dataset.
   * 
   * @param payload The payload of the sentiment data.
   */
  sentimentMessageReceived(payload: ParameterData): void {
    const dataPoints: any[] = [];
    payload.timestamps.forEach((timestamp, i) => {
      const nanoTimestamp= timestamp / 1000000;
      let averageSentiment = payload.numericValues["average_sentiment"]?.at(i) || payload.numericValues["mean(average_sentiment)"]?.at(i) || 0;
      const dataPoint = { x: nanoTimestamp, y: averageSentiment };
      dataPoints.push(dataPoint);
    });

    // Add new points to the dataset and update the chart
    this.chartConfiguration.data.datasets?.at(0)?.data?.push(...dataPoints);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
