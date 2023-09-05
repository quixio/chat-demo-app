import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartDataset, ChartOptions, Legend, LinearScale, LineController, LineElement, PointElement } from 'chart.js';
import ChartStreaming, { RealTimeScale } from 'chartjs-plugin-streaming';
import { Subject, filter, takeUntil } from 'rxjs';
import { ParameterData } from 'src/app/models/parameter-data';
import { QuixService } from 'src/app/services/quix.service';

@Component({
  selector: 'app-sentiment-chart',
  templateUrl: './sentiment-chart.component.html',
  styleUrls: ['./sentiment-chart.component.scss']
})
export class SentimentChartComponent implements OnInit, OnDestroy {

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
  }

  private unsubscribe$ = new Subject<void>();
  
  constructor(private quixService: QuixService) { 
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
    // Listen for reader messages
    this.quixService.paramDataReceived$
     .pipe(takeUntil(this.unsubscribe$), filter((f) => f.topicId === this.quixService.sentimentTopic))
     .subscribe((payload) => {
      this.sentimentMessageRecieved(payload);
    });
  }

  sentimentMessageRecieved(payload: ParameterData): void {
    let [timestamp] = payload.timestamps;
    let averageSentiment = payload.numericValues["average_sentiment"]?.at(0) || 0;
    let row = { x: timestamp / 1000000, y: averageSentiment };
    this.datasets[0].data.push(row as any);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
