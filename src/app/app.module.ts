import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapService } from './shared/services/map.service';
import { GameService } from './shared/services/game.service';
import { WebsocketService } from './shared/services/websocket.service';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [ 
    MapService, 
    GameService, 
    WebsocketService 
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
