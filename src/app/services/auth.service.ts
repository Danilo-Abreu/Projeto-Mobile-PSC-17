import { Injectable } from '@angular/core';

export interface User {
  nome: string;
  sobrenome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  senha: string;
  cep: string;
  endereco: string;
  complemento: string;
  tipoUsuario: 'paciente' | 'psicologo';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: User[] = [];

  constructor() {}

  login(email: string, senha: string): Promise<boolean> {
    return new Promise((resolve) => {
      const user = this.users.find(u => u.email === email && u.senha === senha);
      if (user) {
        console.log('Login successful:', user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        resolve(true);
      } else {
        console.log('Login failed: Invalid credentials');
        resolve(false);
      }
    });
  }

  register(userData: User): Promise<boolean> {
    return new Promise((resolve) => {
      // Verificar se email já existe
      const existingUser = this.users.find(u => u.email === userData.email);
      if (existingUser) {
        console.log('Registration failed: Email already exists');
        resolve(false);
        return;
      }

      // Adicionar novo usuário
      this.users.push(userData);
      console.log('Registration successful:', userData);
      resolve(true);
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
}
