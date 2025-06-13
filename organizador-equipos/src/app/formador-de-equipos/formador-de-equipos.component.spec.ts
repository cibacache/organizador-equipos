import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormadorDeEquiposComponent } from './formador-de-equipos.component';

describe('FormadorDeEquiposComponent', () => {
  let component: FormadorDeEquiposComponent;
  let fixture: ComponentFixture<FormadorDeEquiposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormadorDeEquiposComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormadorDeEquiposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});