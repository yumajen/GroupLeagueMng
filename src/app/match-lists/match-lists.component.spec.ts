import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchListsComponent } from './match-lists.component';

describe('MatchListsComponent', () => {
  let component: MatchListsComponent;
  let fixture: ComponentFixture<MatchListsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatchListsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatchListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
