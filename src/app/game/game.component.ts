import { Component, OnInit, OnDestroy } from '@angular/core';

import * as Phaser from 'phaser-ce/build/custom/phaser-split';

import { GameStatusModel } from "../shared/model/game-status.model";
import { MessageManagerService } from "../shared/services/websocket/message-manager.service";
import { GameConfigService } from "../shared/services/game/game-config.service";
import { ExplosionService } from "../shared/services/bomb/explosion.service";
import { UtilService } from "../shared/services/game/util.service";
import { gameControllerService } from "../shared/services/game/game-controller.service";
import { environment } from "../../environments/environment.prod";
import { EventTypeEnum } from "../shared/enums/event-type.enum";
import { PlayerModule } from "../shared/model/player.model";
import { GameStatusEnum } from "../shared/enums/game-status.enum";
import { RoomService } from "../shared/services/room.service";

@Component({
  selector: 'game-component',
  templateUrl: './game.component.html',
  // styleUrls: ['./app.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  gameStatusEnum = GameStatusEnum;
  
  constructor(private roomService: RoomService,
    private messageManager: MessageManagerService, 
    private gameConfig: GameConfigService,
    private gameController: gameControllerService,
    private explosionService: ExplosionService,
    private util: UtilService) { }
    
  ngOnInit() { 
    localStorage.clear();
  }

  ngOnDestroy() { 
    localStorage.clear();
  }

  enterRoom() {
    this.roomService.enterRoom();
    this.gameController.gameStatus = GameStatusEnum.WAITING;
    this.messageManager.sendMessage(EventTypeEnum.READY);    
    this.checkGameInit();
  }

  checkGameInit() {
    this.messageManager.event.subscribe(data => {
      console.log('checkGameInit', data)
      if (data.type === EventTypeEnum.START) 
        this.buildPhaser(
          this.messageManager, 
          this.gameConfig, 
          this.gameController, 
          this.explosionService, 
          this.util);
    });
  }

  hidePlayButton() {
    return this.gameController.gameStatus === GameStatusEnum.WAITING 
        || this.gameController.gameStatus === GameStatusEnum.PLAYING
  }

  buildPhaser(
    messageManager: MessageManagerService,
    gameConfig: GameConfigService,
    gameController: gameControllerService,
    explosionService: ExplosionService,
    util: UtilService) {    
    
    gameController.gameStatus = GameStatusEnum.PLAYING;
    
    // player
    const playerStatus: PlayerModule = {
      position: { x: 1, y: 1 },
      bombs: 1,
      range: 1
    };

    let putOff = false;

    const screenWidth = environment.tile.tileSize * environment.tile.mapWidth;
    const screenHeight = environment.tile.tileSize * environment.tile.mapHeight;

    gameConfig.game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, 'content', {
      preload: preload,
      create: create,
      update: update
    });

    function preload() {
      gameConfig.loadAssets();
    }

    function create() {

      gameConfig.game.physics.startSystem(Phaser.Physics.ARCADE);

      // tilemap
      gameConfig.loadTileMap();

      // obstacles
      gameConfig.defineObstacles();

      // player
      gameConfig.definePlayer();
      gameConfig.definePlayerCollision(checkPlayerCollision);

      // TODO: inicializar em lugares opostos
      gameConfig.defineOtherPlayer();

      // keyboard
      gameConfig.defineCursors();
    }

    function update() {

      if (gameController.gameStatus !== GameStatusEnum.PLAYING) {
        // TODO: substituir esse destroy por um reload do componente, que tal?
        gameConfig.game.destroy();
        return;
      }

      // collisions
      gameController.checkCollisions();

      gameController.checkKeyboard();

      gameConfig.game.input.keyboard.onDownCallback = (e) => {
        if (e.keyCode === 32) explosionService.spanwBomb();
      };

    }

    function checkPlayerCollision(p, other) {
      if (other.key === 'explosion') {
        gameController.gameStatus = GameStatusEnum.LOSE;
        gameConfig.player.renderable = false;
        messageManager.sendMessage(EventTypeEnum.WIN);
      }
    }

    // TODO: passar pra uma service
    messageManager.event.subscribe(data => {

      if (data.type === EventTypeEnum.BOMB) {
        explosionService.createFakeBomb(data.x, data.y);
        return;
      }
  
      // add fire
      if (data.type === EventTypeEnum.DESTROY_BOX) {
        const fire = explosionService.createFire(data.x, data.y);
        util.createEvent(environment.game.fireDuration, (fire) => fire.destroy(), this, fire);
        return;
      }
  
      // destroy box
      if (data.type === EventTypeEnum.FIRE) {
        const box = explosionService.findBox(data.x, data.y);
        if (box) box.destroy();
        return;
      }
  
      // other player
      if (data.type === EventTypeEnum.PLAYER && gameConfig.otherPlayer !== undefined) {
        gameConfig.otherPlayer.position.x = data.x;
        gameConfig.otherPlayer.position.y = data.y;
        return;
      }
  
      if (data.type === EventTypeEnum.WIN) {
        gameController.gameStatus = GameStatusEnum.WIN;
        gameConfig.otherPlayer.destroy();
      }

    });

  }
}