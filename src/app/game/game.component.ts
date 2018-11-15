import { Component, OnInit, OnDestroy } from "@angular/core";

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

@Component({
  selector: 'game-component',
  templateUrl: './game.component.html',
  // styleUrls: ['./app.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  title = 'app';
  gameStatus: GameStatusEnum;
  gameStatusEnum = GameStatusEnum;

  constructor(private messageManager: MessageManagerService, 
    private gameConfig: GameConfigService,
    private gameController: gameControllerService,
    private explosionService: ExplosionService,
    private util: UtilService) {

  }
    
  ngOnInit() {    
    this.buildPhaser(this.gameStatus, 
      this.messageManager, 
      this.gameConfig, 
      this.gameController, 
      this.explosionService, 
      this.util);
  }

  ngOnDestroy() {

  }

  buildPhaser(gameStatus: GameStatusEnum,
    messageManager: MessageManagerService,
    gameConfig: GameConfigService,
    gameController: gameControllerService,
    explosionService: ExplosionService,
    util: UtilService) {    
    
    gameStatus = GameStatusEnum.PLAYING;
    
    // player
    const playerStatus: PlayerModule = {
      position: { x: 1, y: 1 },
      bombs: 1,
      range: 1
    };

    let putOff = false;

    gameConfig.game = new Phaser.Game(environment.tile.tileSize * environment.tile.mapWidth, environment.tile.tileSize * environment.tile.mapHeight, Phaser.AUTO, 'content', {
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

      if (gameStatus !== GameStatusEnum.PLAYING) gameConfig.game.destroy();

      // collisions
      gameController.checkCollisions();

      gameController.checkKeyboard();

      gameConfig.game.input.keyboard.onDownCallback = (e) => {
        if (e.keyCode === 32) explosionService.spanwBomb();
      };

    }

    function checkPlayerCollision(p, other) {
      if (other.key === 'explosion') {
        gameStatus = GameStatusEnum.LOSE;
        gameConfig.player.renderable = false;
        messageManager.sendMessage(EventTypeEnum.WIN, 0, 0);
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
        gameStatus = GameStatusEnum.WIN;
        gameConfig.otherPlayer.destroy();
      }

    });

  }
}