import { TestBed } from '@angular/core/testing';

import { InMemoryGroupDataService } from './in-memory-group-data.service';

describe('InMemoryGroupDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InMemoryGroupDataService = TestBed.get(InMemoryGroupDataService);
    expect(service).toBeTruthy();
  });
});
