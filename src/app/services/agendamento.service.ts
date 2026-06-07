
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface para o modelo de Agendamento
export interface Agendamento {
  id?: string; // ID do documento no Firestore
  pacienteEmail: string; // E-mail do paciente
  psicologoEmail: string; // E-mail do psicólogo
  dataHora: Date; // Data e hora da consulta
  duracaoMinutos: number; // Duração da consulta em minutos
  status: 'agendada' | 'confirmada' | 'cancelada' | 'realizada';
  observacoes?: string; // Notas adicionais (opcional)
  criadoEm: Date; // Timestamp de criação do agendamento
}

@Injectable({
  providedIn: 'root'
})
export class AgendamentoService {

  constructor(private firestore: AngularFirestore) { }

  /**
   * Cria um novo agendamento no Firestore.
   * @param agendamento Dados do agendamento a ser criado.
   */
  async criarAgendamento(agendamento: Agendamento): Promise<void> {
    const id = this.firestore.createId();
    // Converte Date para Timestamp antes de salvar no Firestore
    const agendamentoParaSalvar = {
      ...agendamento,
      id,
      dataHora: agendamento.dataHora, // Firestore converterá automaticamente Date para Timestamp
      criadoEm: new Date() // Firestore converterá automaticamente Date para Timestamp
    };
    await this.firestore.collection('agendamentos').doc(id).set(agendamentoParaSalvar);
  }

  /**
   * Obtém todos os agendamentos de um usuário (paciente ou psicólogo) pelo e-mail.
   * @param userEmail E-mail do usuário.
   * @param tipoUsuario 'paciente' ou 'psicologo' para filtrar o campo correto.
   * @returns Um Observable de array de Agendamentos.
   */
  getAgendamentosPorUsuario(userEmail: string, tipoUsuario: 'paciente' | 'psicologo'): Observable<Agendamento[]> {
    const campoFiltro = tipoUsuario === 'paciente' ? 'pacienteEmail' : 'psicologoEmail';
    return this.firestore.collection<Agendamento>('agendamentos', ref =>
      ref.where(campoFiltro, '==', userEmail).orderBy('dataHora', 'asc')
    ).valueChanges({ idField: 'id' }).pipe(
      map(agendamentos => agendamentos.map(ag => ({
        ...ag,
        dataHora: (ag.dataHora as any).toDate(), // Converte Timestamp de volta para Date
        criadoEm: (ag.criadoEm as any).toDate() // Converte Timestamp de volta para Date
      })))
    );
  }

  /**
   * Obtém agendamentos futuros de um usuário (paciente ou psicólogo) pelo e-mail.
   * @param userEmail E-mail do usuário.
   * @param tipoUsuario 'paciente' ou 'psicologo' para filtrar o campo correto.
   * @returns Um Observable de array de Agendamentos futuros.
   */
  getProximosAgendamentos(userEmail: string, tipoUsuario: 'paciente' | 'psicologo'): Observable<Agendamento[]> {
    const campoFiltro = tipoUsuario === 'paciente' ? 'pacienteEmail' : 'psicologoEmail';
    const agora = new Date();
    return this.firestore.collection<Agendamento>('agendamentos', ref =>
      ref.where(campoFiltro, '==', userEmail)
         .where('dataHora', '>=', agora) // Filtra apenas agendamentos futuros
         .orderBy('dataHora', 'asc')
    ).valueChanges({ idField: 'id' }).pipe(
      map(agendamentos => agendamentos.map(ag => ({
        ...ag,
        dataHora: (ag.dataHora as any).toDate(),
        criadoEm: (ag.criadoEm as any).toDate()
      })))
    );
  }

  /**
   * Atualiza o status de um agendamento específico.
   * @param agendamentoId ID do agendamento a ser atualizado.
   * @param status Novo status do agendamento.
   */
  async atualizarStatusAgendamento(agendamentoId: string, status: Agendamento['status']): Promise<void> {
    await this.firestore.collection('agendamentos').doc(agendamentoId).update({ status });
  }

  /**
   * Obtém os detalhes de um agendamento específico pelo ID.
   * @param agendamentoId ID do agendamento.
   * @returns Um Observable do Agendamento ou undefined se não encontrado.
   */
  getAgendamento(agendamentoId: string): Observable<Agendamento | undefined> {
    return this.firestore.collection<Agendamento>('agendamentos').doc(agendamentoId).valueChanges().pipe(
      map(ag => ag ? {
        ...ag,
        dataHora: (ag.dataHora as any).toDate(),
        criadoEm: (ag.criadoEm as any).toDate()
      } : undefined)
    );
  }

  /**
   * Obtém a agenda de um psicólogo para um dia específico.
   * @param psicologoEmail E-mail do psicólogo.
   * @param data Data para filtrar os agendamentos.
   * @returns Um Observable de array de Agendamentos para o dia especificado.
   */
  getAgendaDiariaPsicologo(psicologoEmail: string, data: Date): Observable<Agendamento[]> {
    const inicioDoDia = new Date(data);
    inicioDoDia.setHours(0, 0, 0, 0);
    const fimDoDia = new Date(data);
    fimDoDia.setHours(23, 59, 59, 999);

    return this.firestore.collection<Agendamento>('agendamentos', ref =>
      ref.where('psicologoEmail', '==', psicologoEmail)
         .where('dataHora', '>=', inicioDoDia)
         .where('dataHora', '<=', fimDoDia)
         .orderBy('dataHora', 'asc')
    ).valueChanges({ idField: 'id' }).pipe(
      map(agendamentos => agendamentos.map(ag => ({
        ...ag,
        dataHora: (ag.dataHora as any).toDate(),
        criadoEm: (ag.criadoEm as any).toDate()
      })))
    );
  }
}