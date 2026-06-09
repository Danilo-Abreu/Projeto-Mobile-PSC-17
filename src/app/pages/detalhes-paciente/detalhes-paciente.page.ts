import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AgendamentoService, Agendamento } from 'src/app/services/agendamento.service';

@Component({
  selector: 'app-detalhes-paciente',
  templateUrl: './detalhes-paciente.page.html',
  styleUrls: ['./detalhes-paciente.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink]
})
export class DetalhesPacientePage implements OnInit {
  paciente: any;
  agendamentos: Agendamento[] = [];
  email: string | null = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private agendamentoService: AgendamentoService
  ) {}

  ngOnInit() {
    this.email = this.route.snapshot.paramMap.get('email');
    if (!this.email) {
      this.isLoading = false;
      return;
    }

    this.auth.getUserByEmail(this.email).subscribe(user => {
      this.paciente = user;
    });

    this.agendamentoService.getAgendamentosPorUsuario(this.email, 'paciente').subscribe(agendamentos => {
      const psicologoEmail = this.auth.getCurrentUser()?.email;
      this.agendamentos = psicologoEmail
        ? agendamentos.filter(ag => ag.psicologoEmail === psicologoEmail)
        : agendamentos;
      this.isLoading = false;
    });
  }

  formatarDataHora(data: Date): string {
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
