import { EventModel } from './shared/model/event.model';
// tslint:disable:curly

import { Component } from '@angular/core';
import 'phaser-ce/build/custom/pixi';
import 'phaser-ce/build/custom/p2';
import * as Phaser from 'phaser-ce/build/custom/phaser-split';
import { PlayerModule } from './player/player.module';
import { EventTypeEnum } from './shared/enums/event-type.enum';
import { MessageManagerService } from './shared/services/game/message-manager.service';
import { environment } from '../environments/environment.prod';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  controller = {
    dead: false,
    winner: false
  };

  title = 'app';

  constructor(messageManager: MessageManagerService) {

    this.buildPhaser(
      this.controller, messageManager);
  }

  buildPhaser(controller, messageManager: MessageManagerService) {    
    

    let map;
    let layer;
    let cursors;
    let boxGroup;

    const fires = [];
    
    // player
    const playerStatus: PlayerModule = {
      position: { x: 1, y: 1 },
      bombs: 1,
      range: 1
    };

    let player;
    let otherPlayer;
    let putOff = false;

    const game = new Phaser.Game(environment.tile.tileSize * environment.tile.mapWidth, environment.tile.tileSize * environment.tile.mapHeight, Phaser.AUTO, 'content', {
      preload: preload,
      create: create,
      update: update
    });

    function preload() {

      game.load.tilemap('map', 'assets/tilemaps/tilemap.json', null, Phaser.Tilemap.TILED_JSON);
      game.load.image('tiles', 'assets/tilemaps/map.png');
      game.load.image('player', 'assets/player-mini.png');
      game.load.image('bomb', 'assets/bomb.png');
      game.load.image('explosion', 'assets/explosion.png');
      game.load.image('box', 'assets/box.png');

    }

    function create() {

      game.physics.startSystem(Phaser.Physics.ARCADE);

      // tilemap
      game.stage.backgroundColor = '#28b162';
      map = game.add.tilemap('map');
      map.addTilesetImage('map', 'tiles');

      map.setCollisionBetween(2, 3);
      layer = map.createLayer('map1');

      layer.resizeWorld();

      // obstacles
      boxGroup = game.add.group();
      boxGroup.enableBody = true;
      map.createFromObjects('boxLayer', 3, 'box', 0, true, false, boxGroup);

      boxGroup.forEach(box => {
        game.physics.arcade.enable(box);
        box.body.immovable = true;
      });

      // player
      player = game.add.sprite(environment.tile.tileSize * 2, environment.tile.tileSize * 3, 'player');
      game.physics.arcade.enable(player);

      player.body.collideWorldBounds = true;

      player.body.onCollide = new Phaser.Signal();
      player.body.onCollide.add(checkPlayerCollision, this);

      // TODO: inicializar em lugares opostos
      otherPlayer = game.add.sprite(environment.tile.tileSize * 2, environment.tile.tileSize * 3, 'player');

      // keyboard
      cursors = game.input.keyboard.createCursorKeys();

    }

    function update() {

      if (controller.dead) return;

      // collisions
      game.physics.arcade.collide(player, layer);
      game.physics.arcade.collide(player, boxGroup);

      fires.forEach(fire => game.physics.arcade.collide(player, fire));

      checkKeyboard(cursors);

    }

    function checkPlayerCollision(p, other) {
      if (other.key === 'explosion') {
        controller.dead = true;
        player.renderable = false;
        messageManager.sendMessage(EventTypeEnum.WIN, 0, 0);
      }
    }

    function checkKeyboard(cursors) {
      let moved = false;

      // moves
      if (cursors.up.isDown) {
        player.body.velocity.y = -150;
        moved = true;
      } else if (cursors.down.isDown) {
        player.body.velocity.y = 150;
        moved = true;
      } else if (cursors.left.isDown) {
        player.body.velocity.x = -150;
        moved = true;
      } else if (cursors.right.isDown) {
        player.body.velocity.x = 150;
        moved = true;
      } else {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
      }

      // spawn bomb
      game.input.keyboard.onDownCallback = function (e) {
        if (e.keyCode === 32) spanwBomb();
      };

      // atualiza somente a cada x tempo;
      if (moved && !putOff) {
        messageManager.sendMessage(EventTypeEnum.PLAYER, player.position.x, player.position.y);

        putOff = true;
        setTimeout(() => putOff = false, 10);
      }
    }

    function spanwBomb() {
      if (!playerStatus.bombs) return;

      playerStatus.bombs--;

      const x = player.position.x - player.position.x % environment.tile.tileSize;
      const y = player.position.y - player.position.y % environment.tile.tileSize;

      const bomb = game.add.sprite(x, y, 'bomb');

      createEvent(environment.game.bombDuration, detonateBomb, this, bomb);

      messageManager.sendMessage(EventTypeEnum.BOMB, x, y);
    }

    function detonateBomb(bomb) {
      playerStatus.bombs++;

      const explosion = [];

      addFire(bomb.position.x, bomb.position.y);

      for (let i = 1; i <= playerStatus.range; i++) {
        const x = bomb.position.x;
        const y = bomb.position.y + environment.tile.tileSize * i;
        if (!explode(x, y)) break;
        addFire(x, y);
      }

      for (let i = 1; i <= playerStatus.range; i++) {
        const x = bomb.position.x + environment.tile.tileSize * i;
        const y = bomb.position.y;
        if (!explode(x, y)) break;
        addFire(x, y);
      }

      for (let i = 1; i <= playerStatus.range; i++) {
        const x = bomb.position.x;
        const y = bomb.position.y - environment.tile.tileSize * i;
        if (!explode(x, y)) break;
        addFire(x, y);
      }

      for (let i = 1; i <= playerStatus.range; i++) {
        const x = bomb.position.x - environment.tile.tileSize * i;
        const y = bomb.position.y;
        if (!explode(x, y)) break;
        addFire(x, y);
      }

      bomb.destroy();
      explosion.forEach(f => createEvent(environment.game.fireDuration, (f) => f.destroy(), this, f));

      function explode(x: number, y: number) {
        const box = findBox(x, y);

        if (box) {
          box.destroy();
          messageManager.sendMessage(EventTypeEnum.FIRE, x, y);
          return true;
        } else {
          const tile = map.getTile(x / environment.tile.tileSize, y / environment.tile.tileSize, layer);
          if (tile.index === 2) return false;
        }
        return true;
      }

      function addFire(x: number, y: number) {
        explosion.push(createFire(x, y));
        messageManager.sendMessage(EventTypeEnum.DESTROY_BOX, x, y);
      }
    }

    function createFire(x: number, y: number) {

      const fire = game.add.sprite(x, y, 'explosion');
      game.physics.arcade.enable(fire);
      fires.push(fire);

      return fire;
    }

    function findBox(x: number, y: number) {
      return boxGroup.filter(box => (box.position.x === x && box.position.y === y)).list[0];
    }

    function createEvent(seconds, callback, context, params) {
      game.time.events.add(Phaser.Timer.SECOND * seconds, callback, context, params);
    }

    messageManager.event.subscribe(data => {

      console.log(data);

      if (data.type === EventTypeEnum.BOMB) {
        createFakeBomb(data.x, data.y);
        return;
      }
  
      // add fire
      if (data.type === EventTypeEnum.DESTROY_BOX) {
        const fire = createFire(data.x, data.y);
        createEvent(environment.game.fireDuration, (fire) => fire.destroy(), this, fire);
        return;
      }
  
      // destroy box
      if (data.type === EventTypeEnum.FIRE) {
        const box = findBox(data.x, data.y);
        if (box) box.destroy();
        return;
      }
  
      // other player
      if (data.type === EventTypeEnum.PLAYER && otherPlayer !== undefined) {
        otherPlayer.position.x = data.x;
        otherPlayer.position.y = data.y;
        return;
      }
  
      if (data.type === EventTypeEnum.WIN) {
        controller.winner = true;
        otherPlayer.destroy();
      }

    });

    function createFakeBomb(x, y) {
      const bomb = game.add.sprite(x, y, 'bomb');
      createEvent(environment.game.bombDuration, (bomb) => bomb.destroy(), this, bomb);
    }

  }
}
