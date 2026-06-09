// src/app/pages/agendamento/proximas-consultas/proximas-consultas.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AgendamentoService, Agendamento } from 'src/app/services/agendamento.service';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-proximas-consultas',
  templateUrl: './proximas-consultas.page.html',
  styleUrls: ['./proximas-consultas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProximasConsultasPage implements OnInit {

  pacienteEmail: string = '';
  agendamentos$: Observable<Agendamento[]> | undefined;

  constructor(
    private agendamentoService: AgendamentoService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.email && currentUser.tipoUsuario === 'paciente') {
      this.pacienteEmail = currentUser.email;
      this.carregarProximosAgendamentos();
    } else {
      // Redirecionar ou mostrar erro se não for paciente ou não estiver logado
      console.error('Acesso negado: Somente pacientes podem ver esta página.');
      // this.router.navigate(['/login']); // Exemplo de redirecionamento
    }
  }

  /**
   * Carrega os próximos agendamentos do paciente logado.
   */
  carregarProximosAgendamentos() {
    if (this.pacienteEmail) {
      this.agendamentos$ = this.agendamentoService.getProximosAgendamentos(this.pacienteEmail, 'paciente');
    }
  }

  /**
   * Cancela um agendamento.
   * @param agendamentoId ID do agendamento a ser cancelado.
   */
  async cancelarAgendamento(agendamentoId: string) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await this.agendamentoService.atualizarStatusAgendamento(agendamentoId, 'cancelada');
        console.log(`Agendamento ${agendamentoId} cancelado.`);
        // Recarregar agendamentos para refletir a mudança
        this.carregarProximosAgendamentos();
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
      }
    }
  }

  
  formatarDataHora(dataHora: Date): string {
    return dataHora.toLocaleDateString('pt-BR') + ' às ' + dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}