import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/registro/registro.page').then(m => m.RegistroPage)
  },  {
    path: 'perfil-paciente',
    loadComponent: () => import('./pages/perfil-paciente/perfil-paciente.page').then( m => m.PerfilPacientePage)
  },
  {
    path: 'perfil-psicologo',
    loadComponent: () => import('./pages/perfil-psicologo/perfil-psicologo.page').then( m => m.PerfilPsicologoPage)
  }

];
