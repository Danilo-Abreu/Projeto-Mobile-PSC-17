// src/app/pages/agendamento/agendar-consulta/agendar-consulta.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AgendamentoService, Agendamento } from 'src/app/services/agendamento.service';
import { AuthService, User } from 'src/app/services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-agendar-consulta',
  templateUrl: './agendar-consulta.page.html',
  styleUrls: ['./agendar-consulta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgendarConsultaPage implements OnInit {

  psicologoEmail: string | null = null;
  psicologoNome: string = '';
  pacienteEmail: string = '';
  dataConsulta: string = ''; // Usar string para ion-datetime
  horaConsulta: string = ''; // Usar string para ion-datetime
  duracaoMinutos: number = 50; // Padrão de 50 minutos
  observacoes: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agendamentoService: AgendamentoService,
    private authService: AuthService,
    private firestore: AngularFirestore // Injetar AngularFirestore para buscar dados do psicólogo
  ) { }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.email) {
      this.pacienteEmail = currentUser.email;
    } else {
      this.errorMessage = 'Usuário não logado ou e-mail não encontrado.';
      this.router.navigate(['/login']);
      return;
    }

    this.psicologoEmail = this.route.snapshot.paramMap.get('psicologoEmail');
    if (this.psicologoEmail) {
      this.loadPsicologoInfo(this.psicologoEmail);
    } else {
      this.errorMessage = 'E-mail do psicólogo não fornecido.';
    }
  }

  async loadPsicologoInfo(email: string) {
    try {
      const snapshot = await this.firestore.collection('usuarios', ref => ref.where('email', '==', email)).get().toPromise();
      if (snapshot && !snapshot.empty) {
        const psicologo = snapshot.docs[0].data() as User;
        this.psicologoNome = `${psicologo.nome} ${psicologo.sobrenome}`;
      } else {
        this.errorMessage = 'Psicólogo não encontrado.';
      }
    } catch (error) {
      console.error('Erro ao carregar informações do psicólogo:', error);
      this.errorMessage = 'Erro ao carregar informações do psicólogo.';
    }
  }

  async agendar() {
    if (!this.psicologoEmail || !this.pacienteEmail || !this.dataConsulta || !this.horaConsulta) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [ano, mes, dia] = this.dataConsulta.split('-').map(Number);
      const [horas, minutos] = this.horaConsulta.split(':').map(Number);
      const dataHoraAgendamento = new Date(ano, mes - 1, dia, horas, minutos);

      const novoAgendamento: Agendamento = {
        pacienteEmail: this.pacienteEmail,
        psicologoEmail: this.psicologoEmail,
        dataHora: dataHoraAgendamento,
        duracaoMinutos: this.duracaoMinutos,
        status: 'agendada',
        observacoes: this.observacoes,
        criadoEm: new Date()
      };

      await this.agendamentoService.criarAgendamento(novoAgendamento);
      this.router.navigate(['/proximas-consultas']); // Redireciona para a lista de próximas consultas
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      this.errorMessage = 'Erro ao agendar consulta. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }
}