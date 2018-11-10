// tslint:disable:curly
import { Component } from '@angular/core';
import 'phaser-ce/build/custom/pixi';
import 'phaser-ce/build/custom/p2';
import * as Phaser from 'phaser-ce/build/custom/phaser-split';
import { PlayerModule } from './player/player.module';
import { EventTypeEnum } from './shared/enums/event-type.enum';
import { MessageManagerService } from './shared/services/game/message-manager.service';
import { environment } from '../environments/environment.prod';
import { GameStatusModel } from './shared/model/game-statu.model';
import { GameConfigService } from './shared/services/game/game-config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'app';
  gameStatus = new GameStatusModel();

  constructor(messageManager: MessageManagerService, gameConfig: GameConfigService) {

    this.buildPhaser(this.gameStatus, messageManager, gameConfig);
  }

  buildPhaser(gameStatus: GameStatusModel,
    messageManager: MessageManagerService,
    gameConfig: GameConfigService) {    
    
    gameStatus.dead = false;
    gameStatus.winner = false;

    const fires = [];
    
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
      gameConfig.game.physics.arcade.collide(gameConfig.player, gameConfig.layer);
      gameConfig.game.physics.arcade.collide(gameConfig.player, gameConfig.boxGroup);

      fires.forEach(fire => gameConfig.game.physics.arcade.collide(gameConfig.player, fire));

      checkKeyboard(gameConfig.cursors);

    }

    function checkPlayerCollision(p, other) {
      if (other.key === 'explosion') {
        gameStatus.dead = true;
        gameConfig.player.renderable = false;
        messageManager.sendMessage(EventTypeEnum.WIN, 0, 0);
      }
    }

    function checkKeyboard(cursors) {
      let moved = false;

      // moves
      if (cursors.up.isDown) {
        gameConfig.player.body.velocity.y = -150;
        moved = true;
      } else if (cursors.down.isDown) {
        gameConfig.player.body.velocity.y = 150;
        moved = true;
      } else if (cursors.left.isDown) {
        gameConfig.player.body.velocity.x = -150;
        moved = true;
      } else if (cursors.right.isDown) {
        gameConfig.player.body.velocity.x = 150;
        moved = true;
      } else {
        gameConfig.player.body.velocity.x = 0;
        gameConfig.player.body.velocity.y = 0;
      }

      // spawn bomb
      gameConfig.game.input.keyboard.onDownCallback = function (e) {
        if (e.keyCode === 32) spanwBomb();
      };

      // atualiza somente a cada x tempo;
      if (moved && !putOff) {
        messageManager.sendMessage(EventTypeEnum.PLAYER, gameConfig.player.position.x, gameConfig.player.position.y);

        putOff = true;
        setTimeout(() => putOff = false, 10);
      }
    }

    function spanwBomb() {
      if (!playerStatus.bombs) return;

      playerStatus.bombs--;

      const x = gameConfig.player.position.x - gameConfig.player.position.x % environment.tile.tileSize;
      const y = gameConfig.player.position.y - gameConfig.player.position.y % environment.tile.tileSize;

      const bomb = gameConfig.game.add.sprite(x, y, 'bomb');

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
          const tile = gameConfig.map.getTile(x / environment.tile.tileSize, y / environment.tile.tileSize, gameConfig.layer);
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

      const fire = gameConfig.game.add.sprite(x, y, 'explosion');
      gameConfig.game.physics.arcade.enable(fire);
      fires.push(fire);

      return fire;
    }

    function findBox(x: number, y: number) {
      return gameConfig.boxGroup.filter(box => (box.position.x === x && box.position.y === y)).list[0];
    }

    function createEvent(seconds, callback, context, params) {
      gameConfig.game.time.events.add(Phaser.Timer.SECOND * seconds, callback, context, params);
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

    function createFakeBomb(x, y) {
      const bomb = gameConfig.game.add.sprite(x, y, 'bomb');
      createEvent(environment.game.bombDuration, (bomb) => bomb.destroy(), this, bomb);
    }

  }
}
