import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.prod';
import { Subject } from 'rxjs';
import { WebsocketService } from './websocket.service';

@Injectable()
export class GameService {

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

  // constructor(private http: HttpClient) {}

  // getBatata() {
  //   return this.http.get(environment.ws_url + 'game/batata');
  // }

}