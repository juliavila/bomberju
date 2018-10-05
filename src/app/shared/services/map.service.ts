import { Injectable } from '@angular/core';

@Injectable()
export class MapService {

  constructor() { }

  getMap(): Array<number> {
    return [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ];
  }

}
