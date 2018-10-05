import { Component } from '@angular/core';
import 'phaser-ce/build/custom/pixi';
import 'phaser-ce/build/custom/p2';
import * as Phaser from 'phaser-ce/build/custom/phaser-split';
import { MapService } from './shared/services/map.service';
import { MapType } from './shared/enums/map-type.enum';

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
    let mapType = [ 'ground', 'wall', 'obstacle' ]
    
    let game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
      preload: preload,
      create: create
    });

    function preload() {
      console.log('preload')
      game.load.image('ground', 'assets/sokoban/Ground/ground_03.png');
      game.load.image('wall', 'assets/sokoban/Blocks/block_01.png');
      game.load.image('obstacle', 'assets/sokoban/Crates/crate_02.png');
      game.load.image('bomb', 'assets/grindhead-logo.jpg');
      game.load.image('player', 'assets/grindhead-logo.jpg');
    }
  
    function create () {
      console.log('create')

      let position = { x: 0, y: 0 };
      let map = mapService.getMap();
  
      console.log ('>>>>>>>>>>>>', map);
  
      let i = 0;

      for (let y = 0; y < 13; y++){
        for (let x = 0; x < 15; x++){
          console.log('map', mapType[map[i]])
          this.game.add.sprite(position.x, position.y, mapType[map[i]]).scale.set(0.25);
          position.x+=32;
          i++;
          console.log(x)
        }
        console.log(i)
        position.x=0;
        position.y+=32;
      }
    }
  }
}
