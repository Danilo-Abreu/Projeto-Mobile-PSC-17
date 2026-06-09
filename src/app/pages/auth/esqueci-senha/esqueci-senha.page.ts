import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  templateUrl: './esqueci-senha.page.html',
  styleUrls: ['./esqueci-senha.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class EsqueciSenhaPage {
  email: string = '';
  novaSenha: string = '';
  confirmarSenha: string = '';
  message: string = '';
  isLoading: boolean = false;

  constructor(private auth: AuthService, private router: Router) {}

  async redefinirSenha() {
    if (!this.email.trim() || !this.novaSenha || !this.confirmarSenha) {
      this.message = 'Preencha todos os campos.';
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.message = 'As senhas não coincidem.';
      return;
    }

    this.isLoading = true;
    try {
      const success = await this.auth.resetPassword(this.email.trim(), this.novaSenha);
      if (success) {
        this.message = 'Senha redefinida com sucesso. Faça login novamente.';
        this.router.navigate(['/login']);
      } else {
        this.message = 'Email não encontrado.';
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      this.message = 'Erro ao redefinir senha. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }
}
