import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: []
})
export class PlayerModule { 
  position: { x: number, y: number };
  bombs: number;
  range: number;
}
