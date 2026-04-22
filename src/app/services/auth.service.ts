import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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

  constructor(private firestore: AngularFirestore) { }

  // LOGIN
  async login(email: string, senha: string): Promise<boolean> {
    try {
      const snapshot = await this.firestore
        .collection('usuarios', ref =>
          ref.where('email', '==', email).where('senha', '==', senha)
        )
        .get()
        .toPromise();

      if (snapshot && !snapshot.empty) {
        const user = snapshot.docs[0].data() as User;

        console.log('Login successful:', user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      } else {
        console.log('Login failed: Invalid credentials');
        return false;
      }

    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // REGISTRO
  async register(userData: User): Promise<boolean> {
    try {
      // Verifica se email já existe
      const snapshot = await this.firestore
        .collection('usuarios', ref => ref.where('email', '==', userData.email))
        .get()
        .toPromise();

      if (snapshot && !snapshot.empty) {
        console.log('Registration failed: Email already exists');
        return false;
      }

      // Salva no Firebase
      await this.firestore.collection('usuarios').add({
        ...userData,
        criadoEm: new Date()
      });

      console.log('Registration successful:', userData);
      return true;

    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  // LOGOUT
  logout(): void {
    localStorage.removeItem('currentUser');
  }

  // USUÁRIO ATUAL
  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  // VERIFICA SE ESTÁ LOGADO
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  updateUser(user: any) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getPsicologos() {
    return this.firestore
      .collection('usuarios', ref =>
        ref.where('tipoUsuario', '==', 'psicologo')
      )
      .valueChanges();
  }
}