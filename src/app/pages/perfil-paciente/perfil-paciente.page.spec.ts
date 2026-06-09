import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilPacientePage } from './perfil-paciente.page';

describe('PerfilPacientePage', () => {
  let component: PerfilPacientePage;
  let fixture: ComponentFixture<PerfilPacientePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(PerfilPacientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
