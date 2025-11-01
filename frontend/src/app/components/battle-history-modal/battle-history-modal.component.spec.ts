import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleHistoryModalComponent } from './battle-history-modal.component';

describe('BattleHistoryModalComponent', () => {
  let component: BattleHistoryModalComponent;
  let fixture: ComponentFixture<BattleHistoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleHistoryModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattleHistoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
