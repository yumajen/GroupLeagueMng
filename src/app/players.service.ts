import { Injectable } from '@angular/core';
import { Player } from './player';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {

  constructor() { }

  getPlayers(): Player[] {
    return Player.players;
  }
}
