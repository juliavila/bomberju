import { RoomModel } from "./room.model";
import { EventTypeEnum } from "../enums/event-type.enum";

export class EventModel {

  room: RoomModel
  type: EventTypeEnum;
  x?: number;
  y?: number;

}
