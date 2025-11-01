import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortControlsComponent } from './sort-controls.component';

describe('SortControlsComponent', () => {
  let component: SortControlsComponent;
  let fixture: ComponentFixture<SortControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
