import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MessageService } from './shared/services/game/message.service';
import { WebsocketService } from './shared/services/websocket.service';
import { MessageManagerService } from './shared/services/game/message-manager.service';
import { GameConfigService } from './shared/services/game/game-config.service';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [ 
    MessageService,
    MessageManagerService,
    WebsocketService,
    GameConfigService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
