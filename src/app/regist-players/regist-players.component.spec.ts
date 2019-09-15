import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistPlayersComponent } from './regist-players.component';

describe('RegistPlayersComponent', () => {
  let component: RegistPlayersComponent;
  let fixture: ComponentFixture<RegistPlayersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegistPlayersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistPlayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
