import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PsicologoService {
  constructor(private firestore: AngularFirestore) {}

  obterTodos(): Observable<any[]> {
    return this.firestore
      .collection('usuarios', ref => ref.where('tipoUsuario', '==', 'psicologo'))
      .valueChanges();
  }

  obterPorEmail(email: string): Observable<any | undefined> {
    return this.firestore
      .collection('usuarios', ref => ref.where('email', '==', email))
      .valueChanges()
      .pipe();
  }
}
