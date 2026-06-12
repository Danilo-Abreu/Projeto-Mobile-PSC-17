// src/app/pages/agendamento/agendar-consulta/agendar-consulta.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AgendamentoService, Agendamento } from 'src/app/services/agendamento.service';
import { AuthService, User } from 'src/app/services/auth.service';
import { GoogleCalendarService } from 'src/app/services/google-calendar.service';
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
  googleAuthorized: boolean = false;
  isLoading: boolean = false;
  isConnecting: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agendamentoService: AgendamentoService,
    private authService: AuthService,
    private googleCalendarService: GoogleCalendarService,
    private firestore: AngularFirestore, // Injetar AngularFirestore para buscar dados do psicólogo
    private toastCtrl: ToastController
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

    this.initGoogleCalendar();
  }

  private async initGoogleCalendar() {
    try {
      await this.googleCalendarService.handleAuthCallback();
      this.googleAuthorized = await this.googleCalendarService.ensureAuthorized();
    } catch (error) {
      console.error('Erro ao inicializar Google Calendar:', error);
      this.googleAuthorized = false;
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

      // Verificar disponibilidade do psicólogo para o dia
      if (this.psicologoEmail) {
        const agendaDoDia = await firstValueFrom(this.agendamentoService.getAgendaDiariaPsicologo(this.psicologoEmail, dataHoraAgendamento));
        // checar conflitos por sobreposição
        const novoInicio = dataHoraAgendamento.getTime();
        const novoFim = novoInicio + this.duracaoMinutos * 60000;
        const conflito = (agendaDoDia || []).some(ag => {
          const inicioExistente = (ag.dataHora as any) instanceof Date ? (ag.dataHora as Date).getTime() : new Date(ag.dataHora).getTime();
          const fimExistente = inicioExistente + (ag.duracaoMinutos || 50) * 60000;
          return Math.max(inicioExistente, novoInicio) < Math.min(fimExistente, novoFim);
        });

        if (conflito) {
          this.errorMessage = 'Horário indisponível no dia selecionado. Escolha outro horário.';
          const toast = await this.toastCtrl.create({ message: this.errorMessage, duration: 3000, color: 'danger' });
          await toast.present();
          this.isLoading = false;
          return;
        }
      }

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

      if (this.googleAuthorized) {
        try {
          await this.googleCalendarService.createEvent(this.buildGoogleEvent(novoAgendamento));
          const calendarToast = await this.toastCtrl.create({
            message: 'Evento criado também no Google Agenda.',
            duration: 2500,
            position: 'bottom',
            color: 'success'
          });
          await calendarToast.present();
        } catch (error: any) {
          console.error('Erro ao criar evento no Google Agenda:', error, error?.error ?? error);
          const message = error?.status === 400
            ? 'Erro 400 no Google Agenda. Verifique se o token é válido e se as URLs estão autorizadas.'
            : 'Não foi possível salvar no Google Agenda. O agendamento foi criado localmente.';
          const calendarError = await this.toastCtrl.create({
            message,
            duration: 4000,
            position: 'bottom',
            color: 'warning'
          });
          await calendarError.present();
        }
      }

      const toast = await this.toastCtrl.create({
        message: 'Agendamento confirmado com sucesso.',
        duration: 2500,
        position: 'bottom'
      });
      await toast.present();
      this.router.navigate(['/proximas-consultas']);
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      this.errorMessage = 'Erro ao agendar consulta. Tente novamente.';
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  async conectarGoogleAgenda(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isLoading || this.isConnecting) {
      return;
    }

    this.errorMessage = '';
    this.isConnecting = true;

    try {
      const returnUrl = window.location.pathname + window.location.search;
      console.log('Iniciando autorização Google Agenda, returnUrl=', returnUrl);
      await this.googleCalendarService.authorize(returnUrl);
    } catch (error) {
      console.error('Erro ao iniciar autorização Google Agenda:', error);
      this.errorMessage = 'Não foi possível iniciar o login no Google Agenda. Tente novamente.';
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isConnecting = false;
    }
  }

  private buildGoogleEvent(agendamento: Agendamento) {
    const start = new Date(agendamento.dataHora);
    const end = new Date(start.getTime() + agendamento.duracaoMinutos * 60000);

    return {
      summary: `Consulta com ${this.psicologoNome}`,
      description: agendamento.observacoes || 'Consulta agendada pelo app.',
      start: {
        dateTime: start.toISOString()
      },
      end: {
        dateTime: end.toISOString()
      },
      attendees: [
        { email: agendamento.pacienteEmail },
        { email: agendamento.psicologoEmail }
      ]
    };
  }
}