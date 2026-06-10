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
  {
    path: 'esqueci-senha',
    loadComponent: () =>
      import('./pages/auth/esqueci-senha/esqueci-senha.page').then(m => m.EsqueciSenhaPage)
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
  },

  {
    path: 'agendar-consulta/:psicologoEmail', // Passa o e-mail do psicólogo como parâmetro
    loadComponent: () =>
      import('./pages/agendamento/agendar-consulta/agendar-consulta.page').then(m => m.AgendarConsultaPage)
  },

  {
    path: 'agenda-psicologo',
    loadComponent: () =>
      import('./pages/agendamento/agenda-psicologo/agenda-psicologo.page').then(m => m.AgendaPsicologoPage)
  },

  {
    path: 'google-oauth-callback',
    loadComponent: () => import('./pages/google-oauth-callback/google-oauth-callback.page').then(m => m.GoogleOauthCallbackPage)
  },

  {
    path: 'proximas-consultas',
    loadComponent: () =>
      import('./pages/agendamento/proximas-consultas/proximas-consultas.page').then(m => m.ProximasConsultasPage)
  },

 {
  path: 'sobre-nos',
  loadComponent: () => import('./pages/sobre-nos/sobre-nos.page').then(m => m.SobreNosPage)
 },

 {
    path: 'lista-psicologos',
    loadComponent: () => import('./pages/lista-psicologos/lista-psicologos.page').then(m => m.ListaPsicologosPage)
  },
  
  {
    path: 'detalhes-psicologo/:id',
    loadComponent: () => import('./pages/detalhes-psicologo/detalhes-psicologo.page').then(m => m.DetalhesPsicologoPage)
  },
  {
    path: 'detalhes-paciente/:email',
    loadComponent: () => import('./pages/detalhes-paciente/detalhes-paciente.page').then(m => m.DetalhesPacientePage)
  },

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