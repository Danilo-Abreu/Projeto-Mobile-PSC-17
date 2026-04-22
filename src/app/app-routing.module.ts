import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then(m => m.HomePage)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login.page').then(m => m.LoginPage)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/registro/registro.page').then(m => m.RegistroPage)
  },

  // PERFIL PACIENTE
  {
    path: 'perfil-paciente',
    loadComponent: () => import('./pages/perfil-paciente/perfil-paciente.page')
      .then(m => m.PerfilPacientePage),
    //canActivate: [AuthGuard, RoleGuard],
    data: { role: 'paciente' }
  },

  //  PERFIL PSICÓLOGO 
  {
    path: 'perfil-psicologo',
    loadComponent: () => import('./pages/perfil-psicologo/perfil-psicologo.page')
      .then(m => m.PerfilPsicologoPage),
    //canActivate: [AuthGuard, RoleGuard],
    data: { role: 'psicologo' }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }