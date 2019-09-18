import { TestBed } from '@angular/core/testing';

import { InMemoryPlayerDataService } from './in-memory-player-data.service';

describe('InMemoryPlayerDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InMemoryPlayerDataService = TestBed.get(InMemoryPlayerDataService);
    expect(service).toBeTruthy();
  });
});
