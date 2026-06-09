import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService, User } from '../../services/auth.service';
import { PsicologoService } from '../../services/psicologo.service';
import { AgendamentoService } from '../../services/agendamento.service';

@Component({
  selector: 'app-perfil-paciente',
  templateUrl: './perfil-paciente.page.html',
  styleUrls: ['./perfil-paciente.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class PerfilPacientePage implements OnInit {
  user: User | any = {
    nome: '',
    sobrenome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    senha: '',
    cep: '',
    endereco: '',
    complemento: '',
    tipoUsuario: 'paciente',
    foto: ''
  };
  searchTerm = '';
  psicologos: any[] = [];
  psicologosFiltrados: any[] = [];
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  profileMessage = '';
  passwordMessage = '';
  isLoadingProfile = false;
  isLoadingPassword = false;
  showPasswordForm = false;
  editMode = false;
  showDatepicker = false;
  proximosAgendamentos: any[] = [];

  constructor(
    private authService: AuthService,
    private psicologoService: PsicologoService,
    private agendamentoService: AgendamentoService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.carregarUsuario();
    this.carregarPsicologos();
    this.carregarProximosAgendamentos();
  }

  carregarUsuario() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUserByEmail(currentUser.email).subscribe(user => {
      if (user) {
        this.user = { ...currentUser, ...user };
        this.user.dataNascimentoIso = this.user.dataNascimento ? this.toIsoDate(this.user.dataNascimento) : '';
      }
    });
  }

  carregarPsicologos() {
    this.psicologoService.obterTodos().subscribe((dados: any[]) => {
      this.psicologos = dados;
      this.psicologosFiltrados = dados;
    });
  }

  carregarProximosAgendamentos() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      return;
    }

    this.agendamentoService.getProximosAgendamentos(currentUser.email, 'paciente').subscribe((agendamentos: any[]) => {
      this.proximosAgendamentos = agendamentos;
    });
  }

  filtrarPsicologos() {
    const termo = this.searchTerm.toLowerCase();
    this.psicologosFiltrados = this.psicologos.filter(p =>
      p.nome?.toLowerCase().includes(termo) ||
      p.especialidade?.toLowerCase().includes(termo)
    );
  }

  async salvarPerfil() {
    this.isLoadingProfile = true;
    this.profileMessage = '';

    if (this.user.dataNascimentoIso) {
      this.user.dataNascimento = this.fromIsoDate(this.user.dataNascimentoIso);
    }

    try {
      await this.authService.updateUser(this.user);
      this.profileMessage = 'Perfil atualizado com sucesso.';
      this.editMode = false;
      this.showDatepicker = false;
      await this.showToast(this.profileMessage);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      this.profileMessage = 'Não foi possível atualizar o perfil. Tente novamente.';
    } finally {
      this.isLoadingProfile = false;
    }
  }

  async onFotoSelecionada(event: any) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      this.user.foto = reader.result as string;
      try {
        await this.authService.updateUser(this.user);
        this.profileMessage = 'Foto atualizada com sucesso.';
        await this.showToast(this.profileMessage);
      } catch (error) {
        console.error('Erro ao salvar foto:', error);
        this.profileMessage = 'Não foi possível salvar a foto. Tente novamente.';
      }
    };
    reader.readAsDataURL(file);
  }

  async capturePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });

      this.user.foto = image.dataUrl || '';
      await this.authService.updateUser(this.user);
      this.profileMessage = 'Foto capturada e salva com sucesso.';
      await this.showToast(this.profileMessage);
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      this.profileMessage = 'Não foi possível capturar a foto.';
    }
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
  }

  async alterarSenha() {
    this.isLoadingPassword = true;
    this.passwordMessage = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage = 'A nova senha e a confirmação precisam ser iguais.';
      this.isLoadingPassword = false;
      return;
    }

    if (!this.user.email) {
      this.passwordMessage = 'Usuário não encontrado.';
      this.isLoadingPassword = false;
      return;
    }

    try {
      const success = await this.authService.changePassword(this.user.email, this.currentPassword, this.newPassword);
      if (success) {
        this.passwordMessage = 'Senha alterada com sucesso.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        await this.showToast(this.passwordMessage);
      } else {
        this.passwordMessage = 'Senha atual incorreta.';
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      this.passwordMessage = 'Não foi possível alterar a senha. Tente novamente.';
    } finally {
      this.isLoadingPassword = false;
    }
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.showDatepicker = false;
    }
  }

  agendar(psicologo: any) {
    if (!psicologo?.email) {
      return;
    }
    this.router.navigate(['/agendar-consulta', psicologo.email]);
  }

  toIsoDate(date: string): string {
    const [day, month, year] = date.split('/').map(Number);
    if (!day || !month || !year) {
      return '';
    }
    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  fromIsoDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom'
    });
    toast.present();
  }
}
