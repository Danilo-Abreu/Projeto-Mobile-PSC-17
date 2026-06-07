import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Psicologo {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  crp: string;
  descricao: string;
  fotoUrl?: string;
  valorConsulta: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // Dados mockados para simular a API do Firestore
  private psicologosMock: Psicologo[] = [
    {
      id: '1',
      nome: 'Dra. Ana Silva',
      especialidade: 'Terapia Cognitivo-Comportamental',
      email: 'ana@exemplo.com',
      crp: '06/12345',
      descricao: 'Especialista em ansiedade e depressão com mais de 10 anos de experiência.',
      valorConsulta: 150.00
    },
    {
      id: '2',
      nome: 'Dr. Carlos Oliveira',
      especialidade: 'Psicanálise',
      email: 'carlos@exemplo.com',
      crp: '06/67890',
      descricao: 'Focado em autoconhecimento e desenvolvimento pessoal.',
      valorConsulta: 180.00
    },
    {
      id: '3',
      nome: 'Dra. Juliana Santos',
      especialidade: 'Psicologia Humanista',
      email: 'juliana@exemplo.com',
      crp: '06/11223',
      descricao: 'Atendimento focado na empatia e no potencial de crescimento do indivíduo.',
      valorConsulta: 160.00
    }
  ];

  constructor() { }

  /**
   * Simula a busca de todos os psicólogos da API.
   */
  getPsicologos(): Observable<Psicologo[]> {
    // Simula um pequeno atraso de rede (500ms)
    return of(this.psicologosMock).pipe(delay(500));
  }

  /**
   * Simula a busca de um psicólogo específico pelo ID.
   */
  getPsicologoById(id: string): Observable<Psicologo | undefined> {
    const psicologo = this.psicologosMock.find(p => p.id === id);
    return of(psicologo).pipe(delay(300));
  }

  /**
   * Simula a busca de psicólogos por especialidade ou nome.
   */
  buscarPsicologos(termo: string): Observable<Psicologo[]> {
    const termoLower = termo.toLowerCase();
    const filtrados = this.psicologosMock.filter(p => 
      p.nome.toLowerCase().includes(termoLower) || 
      p.especialidade.toLowerCase().includes(termoLower)
    );
    return of(filtrados).pipe(delay(400));
  }
}