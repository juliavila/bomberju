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

  playerStatus: PlayerModule = {
    position: { x: 1, y: 1 },
    bombs: 1,
    range: 1
  };

  constructor(private messageManager: MessageManagerService) { }
  
  loadAssets() {
    this.game.load.tilemap('map', 'assets/tilemaps/tilemap.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.image('tiles', 'assets/tilemaps/map.png');
    this.game.load.image('player', 'assets/player-mini.png');
    this.game.load.image('bomb', 'assets/bomb.png');
    this.game.load.image('explosion', 'assets/explosion.png');
    this.game.load.image('box', 'assets/box.png');
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

  definePlayer() {
    this.player = this.game.add.sprite(environment.tile.tileSize * 2, environment.tile.tileSize * 3, 'player');
  }

  definePlayerCollision(collionCallback) {
    this.game.physics.arcade.enable(this.player);

    this.player.body.collideWorldBounds = true;

    this.player.body.onCollide = new Phaser.Signal();
    this.player.body.onCollide.add(collionCallback, this);
  }

  defineOtherPlayer() {
    this.otherPlayer = this.game.add.sprite(environment.tile.tileSize * 2, environment.tile.tileSize * 3, 'player');
  }

  defineCursors() {
    this.cursors = this.game.input.keyboard.createCursorKeys();
  }

}