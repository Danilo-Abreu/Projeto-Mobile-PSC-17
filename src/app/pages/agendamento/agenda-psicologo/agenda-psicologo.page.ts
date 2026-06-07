// src/app/pages/agendamento/agenda-psicologo/agenda-psicologo.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AgendamentoService, Agendamento } from 'src/app/services/agendamento.service';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-agenda-psicologo',
  templateUrl: './agenda-psicologo.page.html',
  styleUrls: ['./agenda-psicologo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgendaPsicologoPage implements OnInit {

  psicologoEmail: string = '';
  agendamentos$: Observable<Agendamento[]> | undefined;
  dataSelecionada: string = new Date().toISOString(); // Data atual por padrão

  constructor(
    private agendamentoService: AgendamentoService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.email && currentUser.tipoUsuario === 'psicologo') {
      this.psicologoEmail = currentUser.email;
      this.carregarAgendamentosDoDia();
    } else {
      // Redirecionar ou mostrar erro se não for psicólogo ou não estiver logado
      console.error('Acesso negado: Somente psicólogos podem ver esta agenda.');
      // this.router.navigate(['/login']); // Exemplo de redirecionamento
    }
  }

  /**
   * Carrega os agendamentos para a data selecionada.
   */
  carregarAgendamentosDoDia() {
    if (this.psicologoEmail && this.dataSelecionada) {
      const data = new Date(this.dataSelecionada);
      this.agendamentos$ = this.agendamentoService.getAgendaDiariaPsicologo(this.psicologoEmail, data);
    }
  }

  /**
   * Atualiza o status de um agendamento.
   * @param agendamentoId ID do agendamento.
   * @param novoStatus Novo status a ser aplicado.
   */
  async atualizarStatus(agendamentoId: string, novoStatus: Agendamento['status']) {
    try {
      await this.agendamentoService.atualizarStatusAgendamento(agendamentoId, novoStatus);
      console.log(`Agendamento ${agendamentoId} atualizado para ${novoStatus}`);
      // Recarregar agendamentos para refletir a mudança
      this.carregarAgendamentosDoDia();
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
    }
  }

  // Método para formatar a data e hora para exibição
  formatarDataHora(dataHora: Date): string {
    return dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}