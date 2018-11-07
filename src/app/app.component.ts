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
    // TODO: transformar em enum
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
    let fireDuration = .3;

    // player
    let playerStatus: PlayerModule = {
      position: { x: 1, y: 1 },
      bombs: 1,
      range: 1
    }

    let player;
    let otherPlayer;
    let putOff =  false;

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

      // TODO: inicializar em lugares opostos
      otherPlayer = game.add.sprite(tileSize*2, tileSize*3, 'player');

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
        sendMessage(eventType[4], 0, 0)
      }
    }

    function checkKeyboard(cursors) {
      let moved = false;

      // moves
      if (cursors.up.isDown){
        player.body.velocity.y = -150;
        moved = true;
      }
      else if (cursors.down.isDown) {
        player.body.velocity.y = 150;
        moved = true;
      }
      else if (cursors.left.isDown)
      {
        player.body.velocity.x = -150;
        moved = true;
      }
      else if (cursors.right.isDown)
      {
        player.body.velocity.x = 150;
        moved = true;
      }
      else {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
      }

      // spawn bomb
      game.input.keyboard.onDownCallback = function (e) {
        if (e.keyCode === 32) spanwBomb();
      }

      // TODO: atualizar somente a cada x tempo;
      console.log(putOff);
      if (moved && !putOff){
        console.log('send player move')
        sendMessage(eventType[3], player.position.x, player.position.y);

        putOff = true;
        setTimeout(() => putOff = false, 10);
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
      explosion.forEach( f => createEvent(fireDuration, (f) => f.destroy(), this, f) );
  
      function explode(x: number, y: number) {
        let box = findBox(x, y);
        
        if (box) {
          box.destroy();
          sendMessage(eventType[2], x, y);
          return true;
        } else {
          let tile = map.getTile(x / tileSize, y / tileSize, layer);
          if (tile.index === 2) return false;
        }
        return true;
      }

      function addFire(x: number, y: number) {
        explosion.push(createFire(x, y));
        sendMessage(eventType[1], x, y);
      }
    }

    function createFire(x: number, y: number) {

      let fire = game.add.sprite(x, y, 'explosion');
      game.physics.arcade.enable(fire);
      fires.push(fire);

      return fire;
    }

    function findBox(x: number, y: number) {
      return boxGroup.filter( box => (box.position.x == x && box.position.y == y) ).list[0];
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

      // add bomb
      if (data.type === eventType[0]) {
        createFakeBomb(data.x, data.y);
        return;
      }

      // add fire
      if (data.type === eventType[1]) {
        let fire = createFire(data.x, data.y);
        createEvent(fireDuration, (fire) => fire.destroy(), this, fire)
        return;
      }

      // destroy box
      if (data.type === eventType[2]) {
        let box = findBox(data.x, data.y);
        if (box) box.destroy();
        return;
      }

      // other player
      if (data.type === eventType[3] && otherPlayer !== undefined) {
        console.log('')
        otherPlayer.position.x = data.x;
        otherPlayer.position.y = data.y;
        return;
      }

      if (data.type === eventType[4]) {
        controller.winner = true;
        otherPlayer.destroy();
      }

    })

    function createFakeBomb(x, y) {
      let bomb = game.add.sprite(x, y, 'bomb');
      createEvent(bombDuration, (bomb)=>bomb.destroy(), this, bomb);
    }

  }
}
