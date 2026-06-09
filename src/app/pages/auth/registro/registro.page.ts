import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from 'src/app/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, RouterLink] 
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
  cepLoading: boolean = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {}

  // =========================
  // MÁSCARAS
  // =========================

  formatarCPF(event: any) {
    let valor = event.target.value.replace(/\D/g, '');

    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    this.formData.cpf = valor;
  }

  formatarData(event: any) {
    let valor = event.target.value.replace(/\D/g, '');

    valor = valor.replace(/(\d{2})(\d)/, '$1/$2');
    valor = valor.replace(/(\d{2})(\d)/, '$1/$2');

    this.formData.dataNascimento = valor;
  }

  formatarTelefone(event: any) {
    let valor = event.target.value.replace(/\D/g, '');

    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d{5})(\d)/, '$1-$2');

    this.formData.telefone = valor;
  }

  formatarCEP(event: any) {
    let valor = event.target.value.replace(/\D/g, '');

    valor = valor.replace(/(\d{5})(\d)/, '$1-$2');

    this.formData.cep = valor;
  }

  // =========================
  // VALIDAÇÕES
  // =========================

  hasMinLength(): boolean {
    return this.formData.senha.length >= 8;
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.formData.senha);
  }

  hasLowerCase(): boolean {
    return /[a-z]/.test(this.formData.senha);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.formData.senha);
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
      this.isValidCPF(this.formData.cpf) &&
      this.isValidPhone(this.formData.telefone) &&
      this.isValidPassword(this.formData.senha)
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidCPF(cpf: string): boolean {
    const cpfClean = cpf.replace(/\D/g, '');
    
    if (cpfClean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfClean)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpfClean.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    digit1 = digit1 > 9 ? 0 : digit1;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpfClean.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    digit2 = digit2 > 9 ? 0 : digit2;
    
    return digit1 === parseInt(cpfClean.charAt(9)) &&
           digit2 === parseInt(cpfClean.charAt(10));
  }

  isValidPhone(phone: string): boolean {
    const phoneClean = phone.replace(/\D/g, '');
    return phoneClean.length === 11;
  }

  isValidPassword(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  }

  isValidDate(date: string): boolean {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) return false;

    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);

    const today = new Date();

    return dateObj.getDate() === day &&
           dateObj.getMonth() === month - 1 &&
           dateObj.getFullYear() === year &&
           dateObj <= today;
  }

  // =========================
  // CEP
  // =========================

  async buscarCep() {
    const cepClean = this.formData.cep.replace(/\D/g, '');
    
    if (cepClean.length !== 8) {
      this.errorMessage = 'CEP deve conter 8 dígitos.';
      return;
    }
    
    this.cepLoading = true;
    this.errorMessage = '';
    
    try {
      const response: any = await this.http
        .get('https://viacep.com.br/ws/' + cepClean + '/json/')
        .toPromise();
      
      if (response && !response.erro) {
        this.formData.endereco = response.logradouro + ', ' + response.bairro;
      } else {
        this.errorMessage = 'CEP não encontrado.';
        this.formData.endereco = '';
      }
    } catch (error) {
      this.errorMessage = 'Erro ao buscar CEP.';
      console.error(error);
    } finally {
      this.cepLoading = false;
    }
  }

  // =========================
  // CADASTRO
  // =========================

  async cadastrar() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Preencha todos os campos corretamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.auth.register(this.formData);

      if (success) {
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = 'Email já cadastrado.';
      }

    } catch (error) {
      this.errorMessage = 'Erro no cadastro.';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}