import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App Component', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [App]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'organizador-equipos'`, () => {
    expect(component.title).toEqual('organizador-equipos');
  });
});