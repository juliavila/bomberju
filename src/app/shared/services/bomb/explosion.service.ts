import { Injectable } from "@angular/core";
import { gameControllerService } from "../game/game-controller.service";
import { GameConfigService } from "../game/game-config.service";
import { environment } from "../../../../environments/environment.prod";
import { MessageManagerService } from "../websocket/message-manager.service";
import { EventTypeEnum } from "../../enums/event-type.enum";
import { UtilService } from "../game/util.service";

@Injectable()
export class ExplosionService {

  constructor(private gameConfig: GameConfigService,
    private util: UtilService,
    private messageManager: MessageManagerService) { }

  spanwBomb() {
    console.log('spanw')
    if (!this.gameConfig.playerStatus.bombs) return;

    this.gameConfig.playerStatus.bombs--;

    const x = this.gameConfig.player.position.x - this.gameConfig.player.position.x % environment.tile.tileSize;
    const y = this.gameConfig.player.position.y - this.gameConfig.player.position.y % environment.tile.tileSize;

    const bomb = this.gameConfig.game.add.sprite(x, y, 'bomb');

    this.util.createEvent(environment.game.bombDuration, this.detonateBomb, this, bomb);

    this.messageManager.sendMessage(EventTypeEnum.BOMB, x, y);
  }

  private detonateBomb(bomb) {
    this.gameConfig.playerStatus.bombs++;

    const explosion = [];

    this.addFire(bomb.position.x, bomb.position.y, explosion);

    for (let i = 1; i <= this.gameConfig.playerStatus.range; i++) {
      const x = bomb.position.x;
      const y = bomb.position.y + environment.tile.tileSize * i;
      if (!this.explode(x, y)) break;
      this.addFire(x, y, explosion);
    }

    for (let i = 1; i <= this.gameConfig.playerStatus.range; i++) {
      const x = bomb.position.x + environment.tile.tileSize * i;
      const y = bomb.position.y;
      if (!this.explode(x, y)) break;
      this.addFire(x, y, explosion);
    }

    for (let i = 1; i <= this.gameConfig.playerStatus.range; i++) {
      const x = bomb.position.x;
      const y = bomb.position.y - environment.tile.tileSize * i;
      if (!this.explode(x, y)) break;
      this.addFire(x, y, explosion);
    }

    for (let i = 1; i <= this.gameConfig.playerStatus.range; i++) {
      const x = bomb.position.x - environment.tile.tileSize * i;
      const y = bomb.position.y;
      if (!this.explode(x, y)) break;
      this.addFire(x, y, explosion);
    }

    bomb.destroy();
    explosion.forEach(f => this.util.createEvent(environment.game.fireDuration, (f) => f.destroy(), this, f));

  }

  private explode(x: number, y: number) {
    const box = this.findBox(x, y);

    if (box) {
      box.destroy();
      this.messageManager.sendMessage(EventTypeEnum.FIRE, x, y);
      return true;
    } else {
      const tile = this.gameConfig.map.getTile(x / environment.tile.tileSize, y / environment.tile.tileSize, this.gameConfig.layer);
      if (tile.index === 2) return false;
    }
    return true;
  }
  
  findBox(x: number, y: number) {
    return this.gameConfig.boxGroup.filter(box => (box.position.x === x && box.position.y === y)).list[0];
  }

  private addFire(x: number, y: number, explosion) { 
    explosion.push(this.createFire(x, y));
    this.messageManager.sendMessage(EventTypeEnum.DESTROY_BOX, x, y);
  }

  createFire(x: number, y: number) {
    const fire = this.gameConfig.game.add.sprite(x, y, 'explosion');
    this.gameConfig.game.physics.arcade.enable(fire);
    this.gameConfig.fires.push(fire);

    return fire;
  }

  createFakeBomb(x, y) {
    const bomb = this.gameConfig.game.add.sprite(x, y, 'bomb');
    this.util.createEvent(environment.game.bombDuration, (bomb) => bomb.destroy(), this, bomb);
  }

}