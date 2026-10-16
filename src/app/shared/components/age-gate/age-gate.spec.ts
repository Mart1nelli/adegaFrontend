import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AgeGate } from './age-gate';

describe('AgeGate', () => {
  let fixture: ComponentFixture<AgeGate>;
  let component: AgeGate;
  let router: Router;

  beforeEach(async () => {
    localStorage.removeItem('lume-reserve-age-verified');
    await TestBed.configureTestingModule({
      imports: [AgeGate],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AgeGate);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('lume-reserve-age-verified');
  });

  it('should require age confirmation when no verification is stored', () => {
    expect(component.isVerified()).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('should persist confirmation and close the dialog', () => {
    component.confirmAge();

    expect(component.isVerified()).toBeTrue();
    expect(localStorage.getItem('lume-reserve-age-verified')).toBe('true');
  });

  it('should show the restricted state after declining', () => {
    component.declineAge();

    expect(component.isBlocked()).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
