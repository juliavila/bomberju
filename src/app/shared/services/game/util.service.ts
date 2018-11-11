import { Injectable } from "@angular/core";
import { GameConfigService } from "./game-config.service";
import * as Phaser from 'phaser-ce/build/custom/phaser-split';

@Injectable()
export class UtilService {

  constructor(private gameConfig: GameConfigService) { }
  
  createEvent(seconds, callback, context, params) {
    this.gameConfig.game.time.events.add(Phaser.Timer.SECOND * seconds, callback, context, params);
  }

}