import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { WebsocketService } from '../websocket.service';

@Injectable()
export class MessageService {

  messages: Subject<any>;
  
  constructor(private wsService: WebsocketService) {
    this.messages = <Subject<any>>wsService
      .connect()
      .map((response: any): any => {
        return response;
      })
   }
  
  sendMsg(msg) {
    this.messages.next(msg);
  }

}