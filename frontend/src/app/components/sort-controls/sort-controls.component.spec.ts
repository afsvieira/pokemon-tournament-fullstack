import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SortControlsComponent } from './sort-controls.component';
import { SortBy, SortDirection } from '../../models';

/**
 * Unit tests for SortControlsComponent.
 * Tests sorting functionality and user interaction events.
 */
describe('SortControlsComponent', () => {
  let component: SortControlsComponent;
  let fixture: ComponentFixture<SortControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortControlsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SortControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Verifies component initializes with default values.
   */
  it('should create with default sort options', () => {
    expect(component).toBeTruthy();
    expect(component.currentSortBy).toBe('wins');
    expect(component.currentSortDirection).toBe('desc');
  });

  /**
   * Tests that sort direction toggles correctly between asc and desc.
   */
  it('should toggle sort direction when button is clicked', () => {
    spyOn(component.sortChange, 'emit');
    
    // Initial state is 'desc'
    expect(component.currentSortDirection).toBe('desc');
    
    // Toggle to 'asc'
    component.toggleSortDirection();
    expect(component.currentSortDirection).toBe('asc');
    expect(component.sortChange.emit).toHaveBeenCalledWith({
      sortBy: 'wins',
      sortDirection: 'asc'
    });
    
    // Toggle back to 'desc'
    component.toggleSortDirection();
    expect(component.currentSortDirection).toBe('desc');
  });

  /**
   * Tests that sort field change emits correct event.
   */
  it('should emit sortChange when sort field changes', () => {
    spyOn(component.sortChange, 'emit');
    
    const selectElement = fixture.nativeElement.querySelector('select');
    selectElement.value = 'name';
    selectElement.dispatchEvent(new Event('change'));
    
    expect(component.currentSortBy).toBe('name');
    expect(component.sortChange.emit).toHaveBeenCalledWith({
      sortBy: 'name',
      sortDirection: 'desc'
    });
  });

  /**
   * Tests that all sort options are available in the select dropdown.
   */
  it('should display all sort options', () => {
    const options = fixture.nativeElement.querySelectorAll('option');
    const optionValues = Array.from(options).map((opt: any) => opt.value);
    
    expect(optionValues).toContain('wins');
    expect(optionValues).toContain('losses');
    expect(optionValues).toContain('ties');
    expect(optionValues).toContain('name');
    expect(optionValues).toContain('id');
  });

  /**
   * Tests that sort direction button displays correct icon and text.
   */
  it('should display correct icon and text for sort direction', () => {
    const button = fixture.nativeElement.querySelector('button');
    
    // Test descending (default)
    expect(button.textContent).toContain('Desc');
    expect(button.querySelector('i')).toHaveClass('fa-arrow-down-wide-short');
    
    // Toggle to ascending
    component.toggleSortDirection();
    fixture.detectChanges();
    
    expect(button.textContent).toContain('Asc');
    expect(button.querySelector('i')).toHaveClass('fa-arrow-up-short-wide');
  });
});
