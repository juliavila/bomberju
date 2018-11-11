import { Component } from "@angular/core";

@Component({
  selector: 'menu-component',
  templateUrl: './menu.component.html',
  // styleUrls: ['./app.component.scss']
})
export class MenuComponent {
  constructor() {
    console.log('in menu component')
  }
}