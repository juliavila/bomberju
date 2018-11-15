import { Injectable } from "@angular/core";
import { EventModel } from "../../model/event.model";
import { MessageService } from "./message.service";
import { Subject } from "rxjs";
import { RoomService } from "../room.service";

@Injectable()
export class MessageManagerService {

  event = new Subject<EventModel>();
  
  constructor(private messageService: MessageService,
    private roomService: RoomService) { 
    this.observeMessage();
  }

  sendMessage(type, x, y) {
    let event = new EventModel();
    event.room = this.roomService.getRoom();
    event.type = type;
    event.x = x;
    event.y = y;

    this.messageService.sendMsg(event);
  }

  observeMessage() {
    
    this.messageService.messages.subscribe(res => {
      const data: EventModel = JSON.parse(res.text);
      const room = this.roomService.getRoom();

      console.log('server', data.room)
      console.log('local', room)
      
      if (data.room.roomId === room.roomId
        && data.room.playerId  !==  room.playerId){        
          this.event.next(data);
      }
      
    });
  }

}