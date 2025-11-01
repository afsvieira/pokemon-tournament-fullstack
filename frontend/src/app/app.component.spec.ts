import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

/**
 * Unit tests for AppComponent.
 * Tests main application component initialization and structure.
 */
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule]
    }).compileComponents();
  });

  /**
   * Verifies app component creates successfully.
   */
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  /**
   * Tests that app has the correct title property.
   */
  it('should have the "frontend" title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('frontend');
  });

  /**
   * Tests that app renders with Bootstrap dark theme by default.
   */
  it('should render with dark theme by default', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(app.isDarkTheme).toBeTrue();
    expect(document.body.getAttribute('data-bs-theme')).toBe('dark');
  });

  /**
   * Tests theme toggle functionality.
   */
  it('should toggle theme when button is clicked', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('button');
    
    // Initial state should be dark
    expect(app.isDarkTheme).toBeTrue();
    expect(document.body.getAttribute('data-bs-theme')).toBe('dark');
    
    // Click toggle button
    toggleButton?.click();
    fixture.detectChanges();
    
    // Should switch to light theme
    expect(app.isDarkTheme).toBeFalse();
    expect(document.body.getAttribute('data-bs-theme')).toBe('light');
  });
});
