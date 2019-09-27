import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

@Injectable({
  providedIn: 'root'
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const players = [
    ];

    const groups = [
    ];

    const linkages = [
    ];

    return { players, groups, linkages };
  }
}
