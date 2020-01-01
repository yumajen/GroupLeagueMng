import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPlayerOtherItemsComponent } from './dialog-player-other-items.component';

describe('DialogPlayerOtherItemsComponent', () => {
  let component: DialogPlayerOtherItemsComponent;
  let fixture: ComponentFixture<DialogPlayerOtherItemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogPlayerOtherItemsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogPlayerOtherItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
