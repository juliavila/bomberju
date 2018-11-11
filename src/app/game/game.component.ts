import { Component } from "@angular/core";

import * as Phaser from 'phaser-ce/build/custom/phaser-split';

import { GameStatusModel } from "../shared/model/game-statu.model";
import { MessageManagerService } from "../shared/services/websocket/message-manager.service";
import { GameConfigService } from "../shared/services/game/game-config.service";
import { ExplosionService } from "../shared/services/bomb/explosion.service";
import { UtilService } from "../shared/services/game/util.service";
import { gameControllerService } from "../shared/services/game/game-controller.service";
import { PlayerModule } from "../player/player.module";
import { environment } from "../../environments/environment.prod";
import { EventTypeEnum } from "../shared/enums/event-type.enum";

@Component({
  selector: 'game-component',
  templateUrl: './game.component.html',
  // styleUrls: ['./app.component.scss']
})
export class GameComponent {

  title = 'app';
  gameStatus = new GameStatusModel();

  constructor(messageManager: MessageManagerService, 
    gameConfig: GameConfigService,
    gameController: gameControllerService,
    explosionService: ExplosionService,
    util: UtilService) {

    this.buildPhaser(this.gameStatus, messageManager, gameConfig, gameController, explosionService, util);
  }
  buildPhaser(gameStatus: GameStatusModel,
    messageManager: MessageManagerService,
    gameConfig: GameConfigService,
    gameController: gameControllerService,
    explosionService: ExplosionService,
    util: UtilService) {    
    
    gameStatus.dead = false;
    gameStatus.winner = false;
    
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

      if (gameStatus.dead) return;

      // collisions
      gameController.checkCollisions();

      gameController.checkKeyboard();

      gameConfig.game.input.keyboard.onDownCallback = (e) => {
        if (e.keyCode === 32) explosionService.spanwBomb();
      };

    }

    function checkPlayerCollision(p, other) {
      if (other.key === 'explosion') {
        gameStatus.dead = true;
        gameConfig.player.renderable = false;
        messageManager.sendMessage(EventTypeEnum.WIN, 0, 0);
      }
    }

    // TODO: passar pra uma service
    messageManager.event.subscribe(data => {

      console.log(data);

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
        gameStatus.winner = true;
        gameConfig.otherPlayer.destroy();
      }

    });

  }
}