import { Injectable } from "@angular/core";
import * as Phaser from 'phaser-ce/build/custom/phaser-split';

import { GameConfigService } from "./game-config.service";
import { MessageManagerService } from "../websocket/message-manager.service";
import { EventTypeEnum } from "../../enums/event-type.enum";
import { GameStatusEnum } from "../../enums/game-status.enum";

@Injectable()
export class gameControllerService {

  putOff = false;
  gameStatus: GameStatusEnum;

  constructor(private gameConfig: GameConfigService,
    private messageManager: MessageManagerService,) { }

  checkCollisions() {
    this.gameConfig.game.physics.arcade.collide(this.gameConfig.player, this.gameConfig.layer);
    this.gameConfig.game.physics.arcade.collide(this.gameConfig.player, this.gameConfig.boxGroup);
    this.gameConfig.fires.forEach(fire => this.gameConfig.game.physics.arcade.collide(this.gameConfig.player, fire));
  }

  checkKeyboard() {
    let moved = false;

    // moves
    if (this.gameConfig.cursors.up.isDown) {
      this.gameConfig.player.body.velocity.y = -150;
      moved = true;
    } else if (this.gameConfig.cursors.down.isDown) {
      this.gameConfig.player.body.velocity.y = 150;
      moved = true;
    } else if (this.gameConfig.cursors.left.isDown) {
      this.gameConfig.player.body.velocity.x = -150;
      moved = true;
    } else if (this.gameConfig.cursors.right.isDown) {
      this.gameConfig.player.body.velocity.x = 150;
      moved = true;
    } else {
      this.gameConfig.player.body.velocity.x = 0;
      this.gameConfig.player.body.velocity.y = 0;
    }  
    
    // atualiza somente a cada x tempo;
    if (moved && !this.putOff) {
      
      this.messageManager.sendMessage(
        EventTypeEnum.PLAYER, 
        this.gameConfig.player.position.x, 
        this.gameConfig.player.position.y);

      this.putOff = true;
      setTimeout(() => this.putOff = false, 10);
    }
  }

}