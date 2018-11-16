import { Component } from "@angular/core";
import { RoomService } from "../shared/services/room.service";
import { Router } from "@angular/router";

@Component({
  selector: 'menu-component',
  templateUrl: './menu.component.html',
  // styleUrls: ['./app.component.scss']
})
export class MenuComponent {
  constructor(private roomService: RoomService,
    private router: Router) { }

  play() {
    this.router.navigate(['../play']);
  }
}