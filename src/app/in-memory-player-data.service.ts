import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Player } from './player';

@Injectable({
  providedIn: 'root'
})
export class InMemoryPlayerDataService implements InMemoryDbService {
  createDb() {
    const players = [
    ];

    return { players };
  }
}
