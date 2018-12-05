import { Injectable } from "@angular/core";
import * as Phaser from 'phaser-ce/build/custom/phaser-split';
import { environment } from "../../../../environments/environment.prod";
import { EventTypeEnum } from "../../enums/event-type.enum";
import { MessageManagerService } from "../websocket/message-manager.service";
import { PlayerModule } from "../../model/player.model";

@Injectable()
export class GameConfigService {

  game;

  map;
  layer;
  cursors;
  boxGroup;
  
  fires = [];

  player;
  otherPlayer;

  buttonUp;
  buttonLeft;
  buttonRight;
  buttonDown;
  buttonAction;

  up;
  left;
  right;
  down;
  action;

  // screenWidth = window.innerWidth * window.devicePixelRatio;
  // screenHeight = window.innerHeight * window.devicePixelRatio;
  
  playerStatus: PlayerModule = {
    position: { x: 1, y: 1 },
    bombs: 1,
    range: 1
  };

  positionPlayer1 = { x: 2, y: 3 };
  positionPlayer2 = { x: 12, y: 9 };

  constructor(private messageManager: MessageManagerService) { }
  
  loadAssets() {
    this.game.load.tilemap('map', 'assets/tilemaps/tilemap.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.image('tiles', 'assets/tilemaps/map.png');
    this.game.load.image('player', 'assets/player-mini.png');
    this.game.load.image('other-player', 'assets/other-player-mini.png');
    this.game.load.image('bomb', 'assets/bomb.png');
    this.game.load.image('explosion', 'assets/explosion.png');
    this.game.load.image('box', 'assets/box.png');

    this.game.load.spritesheet('button-up', 'assets/onscreencontrols/transparentDark01.png',61,76);
    this.game.load.spritesheet('button-left', 'assets/onscreencontrols/transparentDark03.png',76,61);
    this.game.load.spritesheet('button-right', 'assets/onscreencontrols/transparentDark04.png',61,76);
    this.game.load.spritesheet('button-down', 'assets/onscreencontrols/transparentDark08.png',76,61);

    this.game.load.spritesheet('button-action', 'assets/onscreencontrols/transparentDark10.png',48,48);
  }

  defineButtons() {

    // const screenWidth = this.game.scale.viewportWidth;
    // const screenHeight = this.game.scale.viewportHeight;

    const screenWidth = environment.tile.tileSize * environment.tile.mapWidth;
    const screenHeight = environment.tile.tileSize * environment.tile.mapHeight;


    this.buttonUp = this.game.add.button(50, screenHeight - 160, 'button-up', null, this, 0, 1, 0, 1);
    this.buttonUp.fixedToCamera = true;
    this.buttonUp.events.onInputOver.add(() => this.up = true);
    this.buttonUp.events.onInputOut.add(() => this.up = false);
    this.buttonUp.events.onInputDown.add(() => this.up = true);
    this.buttonUp.events.onInputUp.add(() => this.up = false);

    this.buttonLeft = this.game.add.button(0, screenHeight - 110, 'button-left', null, this, 0, 1, 0, 1);
    this.buttonLeft.fixedToCamera = true;
    this.buttonLeft.events.onInputOver.add(() => this.left = true);
    this.buttonLeft.events.onInputOut.add(() => this.left = false);
    this.buttonLeft.events.onInputDown.add(() => this.left = true);
    this.buttonLeft.events.onInputUp.add(() => this.left = false);

    this.buttonRight = this.game.add.button(85, screenHeight - 110, 'button-right', null, this, 0, 1, 0, 1);
    this.buttonRight.fixedToCamera = true;
    this.buttonRight.events.onInputOver.add(() => this.right = true);
    this.buttonRight.events.onInputOut.add(() => this.right = false);
    this.buttonRight.events.onInputDown.add(() => this.right = true);
    this.buttonRight.events.onInputUp.add(() => this.right = false);

    this.buttonDown = this.game.add.button(50, screenHeight - 76, 'button-down', null, this, 0, 1, 0, 1);
    this.buttonDown.fixedToCamera = true;
    this.buttonDown.events.onInputOver.add(() => this.down = true);
    this.buttonDown.events.onInputOut.add(() => this.down = false);
    this.buttonDown.events.onInputDown.add(() => this.down = true);
    this.buttonDown.events.onInputUp.add(() => this.down = false);

    this.buttonAction = this.game.add.button(screenWidth - 100, screenHeight - 100, 'button-action', null, this, 0, 1, 0, 1);
    this.buttonAction.fixedToCamera = true;
    this.buttonAction.events.onInputOver.add(() => this.action = true);
    this.buttonAction.events.onInputOut.add(() => this.action = false);
    this.buttonAction.events.onInputDown.add(() => this.action = true);
    this.buttonAction.events.onInputUp.add(() => this.action = false);
  }

  loadTileMap() {
    
    this.game.stage.backgroundColor = '#28b162';
    this.map = this.game.add.tilemap('map');
    this.map.addTilesetImage('map', 'tiles');

    this.map.setCollisionBetween(2, 3);
    this.layer = this.map.createLayer('map1');

    this.layer.resizeWorld();
  }

  defineObstacles() {
    this.boxGroup = this.game.add.group();
    this.boxGroup.enableBody = true;
    this.map.createFromObjects('boxLayer', 3, 'box', 0, true, false, this.boxGroup);

    this.boxGroup.forEach(box => {
      this.game.physics.arcade.enable(box);
      box.body.immovable = true;
    });
  }

  definePlayer(fisrtPlayer: boolean) {
    let pos = fisrtPlayer ? this.positionPlayer1 : this.positionPlayer2;

    this.player = this.game.add.sprite(
      environment.tile.tileSize * pos.x, 
      environment.tile.tileSize * pos.y, 
      'player');
  }

  definePlayerCollision(collionCallback) {
    this.game.physics.arcade.enable(this.player);

    this.player.body.collideWorldBounds = true;

    this.player.body.onCollide = new Phaser.Signal();
    this.player.body.onCollide.add(collionCallback, this);
  }

  defineOtherPlayer(fisrtPlayer: boolean) {
    let pos = fisrtPlayer ? this.positionPlayer1 : this.positionPlayer2;

    this.otherPlayer = this.game.add.sprite(
      environment.tile.tileSize * pos.x,
      environment.tile.tileSize * pos.y,
      'other-player');
  }

  defineCursors() {
    this.cursors = this.game.input.keyboard.createCursorKeys();
  }

}