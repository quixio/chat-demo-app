import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { WebchatComponent } from "./components/webchat/webchat.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgChartsModule } from "ng2-charts";
import { LobbyComponent } from './components/lobby/lobby.component';
import { MaterialModule } from './material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { InfoComponent } from './components/info/info.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { WebChat2Component } from './components/web-chat2/web-chat2.component';
import { MessageSourceDropdownComponent } from './components/message-source-dropdown/message-source-dropdown.component';
import { SentimentChartComponent } from './components/sentiment-chart/sentiment-chart.component';
import { NewChatroomDialogComponent } from './components/dialogs/new-chatroom-dialog/new-chatroom-dialog.component';
import { ShareChatroomDialogComponent } from './components/dialogs/share-chatroom-dialog/share-chatroom-dialog.component';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  declarations: [
    AppComponent,
    WebchatComponent,
    LobbyComponent,
    InfoComponent,
    HomePageComponent,
    WebChat2Component,
    MessageSourceDropdownComponent,
    SentimentChartComponent,
    NewChatroomDialogComponent,
    ShareChatroomDialogComponent,
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