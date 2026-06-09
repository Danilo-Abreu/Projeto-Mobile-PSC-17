import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from 'src/app/services/auth.service';
import { AgendamentoService } from 'src/app/services/agendamento.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-perfil-psicologo',
  templateUrl: './perfil-psicologo.page.html',
  styleUrls: ['./perfil-psicologo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class PerfilPsicologoPage implements OnInit {

  user: any;
  pacientes: any[] = [];
  mostrarPacientes: boolean = false;
  currentSenha: string = '';
  novaSenha: string = '';
  confirmarSenha: string = '';
  senhaMessage: string = '';

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
  }

  async tirarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });

      const fotoBase64 = image.dataUrl;
      this.user.foto = fotoBase64;
      await this.auth.updateUser(this.user);
      console.log('Foto salva com sucesso!');

    } catch (error) {
      console.error('Erro ao tirar foto:', error);
    }
  }

  async alterarSenha() {
    if (!this.currentSenha || !this.novaSenha || !this.confirmarSenha) {
      this.senhaMessage = 'Preencha todos os campos.';
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.senhaMessage = 'As senhas não coincidem.';
      return;
    }

    try {
      const success = await this.auth.changePassword(this.user.email, this.currentSenha, this.novaSenha);
      if (success) {
        this.senhaMessage = 'Senha atualizada com sucesso.';
        this.currentSenha = '';
        this.novaSenha = '';
        this.confirmarSenha = '';
      } else {
        this.senhaMessage = 'Senha atual incorreta.';
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      this.senhaMessage = 'Erro ao alterar senha. Tente novamente.';
    }
  }

  carregarPacientes() {
    if (this.mostrarPacientes) {
      this.mostrarPacientes = false;
      return;
    }

    if (!this.user?.email) {
      return;
    }

    this.agendamentoService.getAgendamentosPorUsuario(this.user.email, 'psicologo').subscribe(agendamentos => {
      const emails = [...new Set(agendamentos.map(ag => ag.pacienteEmail))];
      if (emails.length === 0) {
        this.pacientes = [];
        this.mostrarPacientes = true;
        return;
      }

      this.auth.getUsersByEmails(emails).subscribe(users => {
        this.pacientes = users;
        this.mostrarPacientes = true;
      });
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
