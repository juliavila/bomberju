import { Component, OnInit, OnDestroy } from '@angular/core';

import * as Phaser from 'phaser-ce/build/custom/phaser-split';

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
import { GifService } from '../shared/services/gif.service';

@Component({
  selector: 'game-component',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  gameStatusEnum = GameStatusEnum;
  winGif: string;

  words = ['victory','celebration','dancing','win','happy'];

  fisrtPlayer = false;
  
  constructor(private roomService: RoomService,
    private messageManager: MessageManagerService, 
    private gameConfig: GameConfigService,
    private gameController: gameControllerService,
    private explosionService: ExplosionService,
    private util: UtilService,
    private gifService: GifService) { }
    
  ngOnInit() { 
    localStorage.clear();

    this.refreshWinGif(this.words[(Math.random() * 5)]);
  }

  ngOnDestroy() { 
    localStorage.clear();
  }

  refresh(): void {
    window.location.reload();
  }

  enterRoom() {
    this.gameController.gameStatus = GameStatusEnum.WAITING;
    this.roomService.enterRoom().then(() => {
      this.messageManager.sendMessage(EventTypeEnum.READY);    
      console.log('>>>>>>>>>>', this.roomService.getRoom())
      this.fisrtPlayer = this.roomService.getRoom().playerId == '1';
      this.checkGameInit();
    });
  }

  checkGameInit() {
    this.messageManager.event.subscribe(data => {
      console.log('checkGameInit', data)
      if (data.type === EventTypeEnum.START) {
        this.buildPhaser(
          this.messageManager, 
          this.gameConfig, 
          this.gameController, 
          this.explosionService, 
          this.util,
          this.fisrtPlayer);
      }
    });
  }

  hidePlayButton() {
    return !!this.gameController.gameStatus;
  }

  showPlayAgain() {
    return this.gameController.gameStatus === this.gameStatusEnum.WIN 
        || this.gameController.gameStatus === this.gameStatusEnum.LOSE;
  }

  refreshWinGif(search: string) {
    this.gifService.getGif(search)
      .then(
        res => this.winGif = res.data.image_url, 
        err => this.winGif = 'https://media.giphy.com/media/3oz8xwooUvMqNB1zEs/giphy.gif'
      );
  }

  buildPhaser(
    messageManager: MessageManagerService,
    gameConfig: GameConfigService,
    gameController: gameControllerService,
    explosionService: ExplosionService,
    util: UtilService,
    fisrtPlayer: boolean) {    
    
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

    // window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.CANVAS, 'gameArea'

    gameConfig.game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, 'content', {
      preload: preload,
      create: create,
      update: update
    });

    function preload() {
      gameConfig.loadAssets();

      gameConfig.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      gameConfig.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    }

    function create() {

      gameConfig.game.physics.startSystem(Phaser.Physics.ARCADE);

      // tilemap
      gameConfig.loadTileMap();

      // obstacles
      gameConfig.defineObstacles();

      // player
      gameConfig.definePlayer(fisrtPlayer);
      gameConfig.definePlayerCollision(checkPlayerCollision);

      // TODO: inicializar em lugares opostos
      gameConfig.defineOtherPlayer(!fisrtPlayer);

      // keyboard
      gameConfig.defineCursors();

      gameConfig.defineButtons();
      
      // console.log('#################', gameConfig.game.scale.compatibility.supportsFullscreen)
      // if (gameConfig.game.scale.compatibility.supportsFullscreen) {
      //   gameConfig.game.scale.startFullscreen();
      // }

      gameConfig.game.world.setBounds(0, 0, environment.tile.tileSize * environment.tile.mapWidth, environment.tile.tileSize * environment.tile.mapHeight);

      gameConfig.game.camera.follow(gameConfig.player);
      // buttonleft.fixedToCamera = true;
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

      if (gameConfig.action) explosionService.spanwBomb();

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