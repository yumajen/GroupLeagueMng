import { TestBed } from '@angular/core/testing';

import { InMemoryLinkageDataService } from './in-memory-linkage-data.service';

describe('InMemoryLinkageDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InMemoryLinkageDataService = TestBed.get(InMemoryLinkageDataService);
    expect(service).toBeTruthy();
  });
});
