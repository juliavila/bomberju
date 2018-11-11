import { Injectable } from "@angular/core";
import { EventModel } from "../../model/event.model";
import { MessageService } from "./message.service";
import { Subject } from "rxjs";

@Injectable()
export class MessageManagerService {

  id: string;
  event = new Subject<EventModel>();
  
  constructor(private messageService: MessageService) { 

    // TODO: passar essa responsabilidade pro back
    this.id = this.createId();
    this.observeMessage();
  }

  sendMessage(type, x, y) {
    let event = new EventModel();
    event.id = this.id;
    event.type = type;
    event.x = x;
    event.y = y;

    this.messageService.sendMsg(event);
  }

  observeMessage() {
    
    this.messageService.messages.subscribe(res => {
      const data: EventModel = JSON.parse(res.text);
      console.log(data);
  
      if (data.id === this.id) return;     
      
      this.event.next(data);
  
    });
  }

  createId() {
    return `${Date.now()}${Math.floor(Math.random() * Math.floor(1000))}`
  }

}