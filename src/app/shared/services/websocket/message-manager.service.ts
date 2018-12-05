import { Injectable } from "@angular/core";
import { EventModel } from "../../model/event.model";
import { MessageService } from "./message.service";
import { Subject } from "rxjs";
import { RoomService } from "../room.service";
import { EventTypeEnum } from "../../enums/event-type.enum";

@Injectable()
export class MessageManagerService {

  event = new Subject<EventModel>();
  
  constructor(private messageService: MessageService,
    private roomService: RoomService) { 
    this.observeMessage();
  }

  sendMessage(type: EventTypeEnum, x?: number, y?: number) {
    if (type === EventTypeEnum.WIN) console.log('get room', this.roomService.getRoom());
    let event = new EventModel();

    console.log('getRoom', this.roomService.getRoom())
    event.room = this.roomService.getRoom();
    event.type = type;


    if (x !== undefined) event.x = x;
    if (y !== undefined) event.y = y;

    this.messageService.sendMsg(event);
  }

  observeMessage() {
    
    this.messageService.messages.subscribe(res => {
      const data: EventModel = JSON.parse(res.text);
      const room = this.roomService.getRoom();

      console.log('server', data)
      console.log('local', room)


      if (data.type === EventTypeEnum.START)
        this.event.next(data)
      
      else if (data.room.roomId === room.roomId
        && data.room.playerId  !==  room.playerId){        
          this.event.next(data);
      }
      
    });
  }

}