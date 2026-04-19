import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from 'src/app/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {

  formData: User = {
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
    tipoUsuario: 'paciente'
  };

  confirmarSenha: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
  }

  isFormValid(): boolean {
    return !!(
      this.formData.nome.trim() &&
      this.formData.sobrenome.trim() &&
      this.formData.cpf.trim() &&
      this.formData.dataNascimento &&
      this.isValidDate(this.formData.dataNascimento) &&
      this.formData.telefone.trim() &&
      this.formData.email.trim() &&
      this.formData.senha &&
      this.confirmarSenha &&
      this.formData.cep.trim() &&
      this.formData.endereco.trim() &&
      this.formData.tipoUsuario &&
      this.formData.senha === this.confirmarSenha &&
      this.isValidEmail(this.formData.email) &&
      this.isValidCPF(this.formData.cpf)
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidCPF(cpf: string): boolean {
    // Validação básica de CPF (pode ser aprimorada)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
    return cpfRegex.test(cpf.replace(/\D/g, ''));
  }

  isValidDate(date: string): boolean {
    // Validação básica de data no formato DD/MM/AAAA
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) return false;

    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);

    // Verifica se a data é válida e se não é futura
    const today = new Date();
    return dateObj.getDate() === day &&
           dateObj.getMonth() === month - 1 &&
           dateObj.getFullYear() === year &&
           dateObj <= today;
  }

  async cadastrar() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.auth.register(this.formData);
      if (success) {
        console.log('Cadastro realizado com sucesso!');
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = 'Email já cadastrado. Tente outro email.';
      }
    } catch (error) {
      this.errorMessage = 'Erro ao realizar cadastro. Tente novamente.';
      console.error('Erro no cadastro:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
