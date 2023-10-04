import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SentimentFilterPipe, WebChatComponent } from "./components/web-chat/web-chat.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgChartsModule } from "ng2-charts";
import { MaterialModule } from './material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { MessageSourceDropdownComponent } from './components/message-source-dropdown/message-source-dropdown.component';
import { SentimentChartComponent } from './components/sentiment-chart/sentiment-chart.component';
import { NewChatroomDialogComponent } from './components/dialogs/new-chatroom-dialog/new-chatroom-dialog.component';
import { ShareChatroomDialogComponent } from './components/dialogs/share-chatroom-dialog/share-chatroom-dialog.component';
import { QRCodeModule } from 'angularx-qrcode';
import { MessageComponent } from './components/message/message.component';

@NgModule({
  declarations: [
    // Page Components
    HomePageComponent,
    
    // General Components
    AppComponent,
    WebChatComponent,
    InfoPanelComponent,
    MessageSourceDropdownComponent,
    SentimentChartComponent,
    MessageComponent,

    // Dialog Components
    NewChatroomDialogComponent,
    ShareChatroomDialogComponent,

    // Pipe
    SentimentFilterPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    QRCodeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }