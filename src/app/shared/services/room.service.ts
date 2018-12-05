import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment.prod";
import { RoomModel } from "../model/room.model";

@Injectable()
export class RoomService {
  
  constructor(private http: HttpClient) {}

  enterRoom(): Promise<void> {
    console.log('enterRoom')
    const url = `${environment.baseUrl}enterRoom`;

    return this.http.get(url)
      .toPromise()
      .then((room: RoomModel) =>{
        localStorage.setItem('room', JSON.stringify(room));
        console.log(room)
      });
  }

  getRoom(): RoomModel {
    return JSON.parse(localStorage.getItem('room'));
  }

}