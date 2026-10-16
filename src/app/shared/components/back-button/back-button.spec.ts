import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter, Router } from '@angular/router';
import { BackButton } from './back-button';

describe('BackButton', () => {
  let fixture: ComponentFixture<BackButton>;
  let component: BackButton;
  let location: Location;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackButton],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BackButton);
    component = fixture.componentInstance;
    location = TestBed.inject(Location);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should be hidden on the home route', () => {
    expect(component.isVisible()).toBeFalse();
  });

  it('should navigate home when browser history has no previous page', () => {
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);
    spyOn(router, 'navigate');

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should use browser history when a previous page exists', () => {
    spyOnProperty(window.history, 'length', 'get').and.returnValue(2);
    spyOn(location, 'back');

    component.goBack();

    expect(location.back).toHaveBeenCalled();
  });
});
