import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  cepLoading: boolean = false;

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) { }

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
      this.isValidCPF(this.formData.cpf) &&
      this.isValidPhone(this.formData.telefone)
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidCPF(cpf: string): boolean {
    // Remove máscara
    const cpfClean = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpfClean.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfClean)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpfClean.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    digit1 = digit1 > 9 ? 0 : digit1;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpfClean.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    digit2 = digit2 > 9 ? 0 : digit2;
    
    return digit1 === parseInt(cpfClean.charAt(9)) && digit2 === parseInt(cpfClean.charAt(10));
  }

  isValidPhone(phone: string): boolean {
    // Remove caracteres não numéricos
    const phoneClean = phone.replace(/\D/g, '');
    // Valida telefone com 11 dígitos (celular)
    return phoneClean.length === 11;
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

  async buscarCep() {
    // Remove máscara do CEP
    const cepClean = this.formData.cep.replace(/\D/g, '');
    
    if (cepClean.length !== 8) {
      this.errorMessage = 'CEP deve conter 8 dígitos.';
      return;
    }
    
    this.cepLoading = true;
    this.errorMessage = '';
    
    try {
      const response: any = await this.http.get('https://viacep.com.br/ws/' + cepClean + '/json/').toPromise();
      
      if (response && !response.erro) {
        // Preenche o endereço automaticamente
        this.formData.endereco = response.logradouro + ', ' + response.bairro;
      } else {
        this.errorMessage = 'CEP não encontrado. Verifique e tente novamente.';
        this.formData.endereco = '';
      }
    } catch (error) {
      this.errorMessage = 'Erro ao buscar CEP. Verifique sua conexão.';
      console.error('Erro na busca de CEP:', error);
    } finally {
      this.cepLoading = false;
    }
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
