import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MessageService } from './shared/services/websocket/message.service';
import { MessageManagerService } from './shared/services/websocket/message-manager.service';
import { GameConfigService } from './shared/services/game/game-config.service';
import { gameControllerService } from './shared/services/game/game-controller.service';
import { WebsocketService } from './shared/services/websocket/websocket.service';
import { ExplosionService } from './shared/services/bomb/explosion.service';
import { UtilService } from './shared/services/game/util.service';

import { GameComponent } from './game/game.component';
import { AppRoutingModule } from './app-routing.module';
import { RoomService } from './shared/services/room.service';

import { HttpModule } from '@angular/http';
import { GifService } from './shared/services/gif.service';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [ 
    MessageService,
    MessageManagerService,
    WebsocketService,
    GameConfigService,
    gameControllerService,
    ExplosionService,
    UtilService,
    RoomService,
    GifService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
