import { Component } from '@angular/core';
import 'phaser-ce/build/custom/pixi';
import 'phaser-ce/build/custom/p2';
import * as Phaser from 'phaser-ce/build/custom/phaser-split';
import { PlayerModule } from './player/player.module';
import { GameService } from './shared/services/game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  controller = {
    dead: false,
    winner: false
  }

  title = 'app';
  
  constructor(private gameService: GameService) {
    this.buildPhaser(this.controller, gameService);
  }
  
  buildPhaser(controller, gameService) {

    // websocket init config
    let eventType = [ 'bomb', 'fire', 'destroyBox', 'player', 'win' ];
    let event = {
      id: createId(),
      type: '',
      x: 0,
      y: 0 
    }

    // tile config
    const tileSize = 32;
    const mapHeight = 13;
    const mapWidth = 15;    

    let map;
    let layer;
    let cursors;
    let boxGroup;

    let fires = [];
    let bombDuration = 2;

    // player
    let playerStatus: PlayerModule = {
      position: { x: 1, y: 1 },
      bombs: 1,
      range: 1
    }

    let player;

    let game = new Phaser.Game(tileSize*mapWidth, tileSize*mapHeight, Phaser.AUTO, 'content', {
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
      player = game.add.sprite(tileSize*2, tileSize*3, 'player');
      game.physics.arcade.enable(player);

      player.body.collideWorldBounds = true;

      player.body.onCollide = new Phaser.Signal();
      player.body.onCollide.add(checkPlayerCollision, this);

      // keyboard
      cursors = game.input.keyboard.createCursorKeys();

    }

    function update() {

      if (controller.dead) return;

      //collisions
      game.physics.arcade.collide(player, layer);
      game.physics.arcade.collide(player, boxGroup);

      fires.forEach(fire => game.physics.arcade.collide(player, fire));
      
      checkKeyboard(cursors);

    }

    function checkPlayerCollision(p, other) {
      if (other.key === 'explosion') {
        controller.dead = true;
        player.renderable = false;
      }
    }

    function checkKeyboard(cursors) {

      // moves
      if (cursors.up.isDown){
        player.body.velocity.y = -150;
      }
      else if (cursors.down.isDown) {
        player.body.velocity.y = 150;
      }
      else if (cursors.left.isDown)
      {
        player.body.velocity.x = -150;
      }
      else if (cursors.right.isDown)
      {
        player.body.velocity.x = 150;
      }
      else {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
      }

      // spawn bomb
      game.input.keyboard.onDownCallback = function (e) {
        if (e.keyCode === 32) spanwBomb();
      }
    }

    function spanwBomb() {
      if (!playerStatus.bombs) return;

      playerStatus.bombs--;

      let x = player.position.x - player.position.x % tileSize;
      let y = player.position.y - player.position.y % tileSize;

      let bomb = game.add.sprite(x, y, 'bomb');

      createEvent(bombDuration, detonateBomb, this, bomb);

      sendMessage(eventType[0], x, y);
    }

    function detonateBomb(bomb) {
      playerStatus.bombs++;
      
      let explosion = [];

      addFire(bomb.position.x, bomb.position.y);

      for(let i = 1; i <= playerStatus.range; i++) {
        let x = bomb.position.x;
        let y = bomb.position.y + tileSize * i;
        if (!explode(x, y)) break;;  
        addFire(x, y);
      }

      for(let i = 1; i <= playerStatus.range; i++) {
        let x = bomb.position.x + tileSize * i;
        let y = bomb.position.y;
        if (!explode(x, y)) break;;  
        addFire(x, y);
      }

      for(let i = 1; i <= playerStatus.range; i++) {
        let x = bomb.position.x;
        let y = bomb.position.y - tileSize * i;
        if (!explode(x, y)) break;;  
        addFire(x, y);
      }

      for(let i = 1; i <= playerStatus.range; i++) {
        let x = bomb.position.x -  tileSize * i;
        let y = bomb.position.y;
        if (!explode(x, y)) break;;  
        addFire(x, y);
      }

      bomb.destroy();
      explosion.forEach( f => createEvent(.3, (f) => f.destroy(), this, f) );
  
      function explode(x: number, y: number) {
        let box = boxGroup.filter( box => (box.position.x == x && box.position.y == y) ).list[0];
        
        if (box) {
          box.destroy();
          box.position.x += 10;
          return true;
        } else {
          let tile = map.getTile(x / tileSize, y / tileSize, layer);
          if (tile.index === 2) return false;
        }
        return true;
      }

      function addFire(x, y) {
        let fire = game.add.sprite(x, y, 'explosion');
        game.physics.arcade.enable(fire);
        fires.push(fire);
        explosion.push(fire);
      }
    }

    function createEvent(seconds, callback, context, params) {
      game.time.events.add(Phaser.Timer.SECOND * seconds, callback, context, params);
    }


    // websocket action

    function createId() {
      return `${Date.now()}${Math.floor(Math.random() * Math.floor(1000))}`
    }

    function sendMessage(type, x, y) {
      event.type = type;
      event.x = x;
      event.y = y;
      gameService.sendMsg(event)
    }

    this.gameService.messages.subscribe(res => {
      let data = JSON.parse(res.text);
      console.log(data);

      if (data.id === event.id) return;

      if (data.type === eventType[0]) {
        createFakeBomb(data);
        return;
      }

    })

    function createFakeBomb(data) {
      let bomb = game.add.sprite(data.x, data.y, 'bomb');
      createEvent(bombDuration, (bomb)=>bomb.destroy(), this, bomb);
    }

  }
}
