import { Injectable } from "../../../../node_modules/@angular/core";
import { HttpClient } from "../../../../node_modules/@angular/common/http";
import { environment } from "../../../environments/environment.prod";

@Injectable()
export class GifService {

  constructor(private http: HttpClient) {}

  getGif(search: string): Promise<any> {

    return this.http.get(`http://api.giphy.com/v1/gifs/random?api_key=${environment.giphyApiKey}&tag=${search}`)
      .toPromise();
  }
}