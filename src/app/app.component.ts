import { Component } from '@angular/core';
import 'phaser-ce/build/custom/pixi';
import 'phaser-ce/build/custom/p2';
import * as Phaser from 'phaser-ce/build/custom/phaser-split';
import { MapService } from './shared/services/map.service';
import { MapType } from './shared/enums/map-type.enum';
import { PlayerModule } from './player/player.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  
  constructor(private mapService: MapService) {
    this.buildPhaser(mapService);
  }
  
  buildPhaser(mapService: MapService) {
    
    // tile config
    const tileSize = 32;
    const mapHeight = 13;
    const mapWidth = 15;    

    let map;
    let layer;
    let cursors;

    // player
    let playerStatus: PlayerModule = {
      position: { x: 1, y: 1 },
      bombs: 1
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
      
      // game.load.image('bomb', 'assets/bomb.png');

      // player = game.add.sprite( 122, 122, 'player' );
      // player.animations.add('teste');
      // player.animations.play('teste', 1, true);

    }
  
    function create() {

      game.physics.startSystem(Phaser.Physics.ARCADE);

      game.stage.backgroundColor = '#28b162'; 
      map = game.add.tilemap('map');  
      map.addTilesetImage('map', 'tiles');

      map.setCollisionBetween(2, 3);      
      layer = map.createLayer('map1');

      layer.resizeWorld();

      player = game.add.sprite(32*2, 32*3, 'player');
      game.physics.arcade.enable(player)

     player.body.collideWorldBounds = true;
     
     cursors = game.input.keyboard.createCursorKeys();

    }

    function update() {
      game.physics.arcade.collide(player, layer);

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
    }
  }
}
