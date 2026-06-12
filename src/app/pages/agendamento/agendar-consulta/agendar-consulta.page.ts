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
    console.log('Psicólogo email recebido:', this.psicologoEmail);
    
    if (this.psicologoEmail) {
      this.loadPsicologoInfo(this.psicologoEmail);
    } else {
      this.errorMessage = 'E-mail do psicólogo não fornecido. Navegue a partir da lista de psicólogos.';
      console.error('Nenhum psicologoEmail na rota');
    }

    this.initGoogleCalendar();
  }

  private async initGoogleCalendar() {
    try {
      this.googleAuthorized = await this.googleCalendarService.ensureAuthorized();
      if (this.googleAuthorized) {
        console.log('Google Calendar autorizado');
      } else {
        console.log('Google Calendar não autorizado. Usuário precisa fazer login.');
      }
    } catch (error: any) {
      console.error('Erro ao inicializar Google Calendar:', error?.message || error);
      this.googleAuthorized = false;
      
      // Mostrar mensagem de erro se necessário
      const errorMessage = error?.message || 'Erro ao inicializar Google Calendar';
      if (errorMessage.includes('Sessão expirada')) {
        const toast = await this.toastCtrl.create({
          message: 'Sessão expirada. Por favor, conecte ao Google Calendar novamente.',
          duration: 4000,
          color: 'warning'
        });
        await toast.present();
      }
    }
  }

  async loadPsicologoInfo(email: string) {
    try {
      console.log('Buscando informações do psicólogo com email:', email);
      
      const snapshot = await this.firestore.collection('usuarios', ref => ref.where('email', '==', email)).get().toPromise();
      
      if (snapshot && !snapshot.empty) {
        const psicologo = snapshot.docs[0].data() as User;
        this.psicologoNome = `${psicologo.nome} ${psicologo.sobrenome}`;
        console.log('Psicólogo encontrado:', this.psicologoNome);
      } else {
        this.errorMessage = `Psicólogo com email ${email} não encontrado no banco de dados.`;
        console.error('Psicólogo não encontrado:', email);
        
        const toast = await this.toastCtrl.create({
          message: 'Psicólogo não encontrado. Verifique se foi selecionado corretamente.',
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Erro ao carregar informações do psicólogo:', error);
      this.errorMessage = 'Erro ao carregar informações do psicólogo.';
      
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async agendar() {
    // Validação inicial rigorosa
    if (!this.psicologoEmail) {
      this.errorMessage = '❌ Email do psicólogo não foi carregado. Volte e tente novamente.';
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    if (!this.pacienteEmail) {
      this.errorMessage = '❌ Seu email não está carregado. Faça login novamente.';
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    if (!this.dataConsulta || !this.horaConsulta) {
      this.errorMessage = '❌ Por favor, preencha DATA e HORA da consulta.';
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    if (!this.psicologoNome || this.psicologoNome.trim() === '') {
      this.errorMessage = '❌ Psicólogo não encontrado. Dados inválidos.';
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('👤 Usuário logado:', this.pacienteEmail);
      console.log('🏥 Psicólogo selecionado:', this.psicologoEmail);
      
      const dataHoraAgendamento = this.buildDateTime(this.dataConsulta, this.horaConsulta);

      if (!dataHoraAgendamento) {
        this.errorMessage = 'Formato de data ou hora inválido. Verifique os campos do agendamento.';
        const toast = await this.toastCtrl.create({
          message: this.errorMessage,
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
        this.isLoading = false;
        return;
      }

      // Validar que a data está no futuro
      if (dataHoraAgendamento.getTime() <= new Date().getTime()) {
        this.errorMessage = 'A data da consulta não pode ser no passado.';
        const toast = await this.toastCtrl.create({
          message: this.errorMessage,
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
        this.isLoading = false;
        return;
      }

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
          const toast = await this.toastCtrl.create({
            message: this.errorMessage,
            duration: 3000,
            color: 'danger'
          });
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

      // Criar agendamento no Firebase
      console.log('📝 Criando agendamento no Firestore:', novoAgendamento);
      try {
        await this.agendamentoService.criarAgendamento(novoAgendamento);
        console.log('✅ Agendamento criado no Firebase com sucesso');
      } catch (firebaseError: any) {
        console.error('❌ ERRO AO CRIAR NO FIRESTORE:', firebaseError?.message || firebaseError?.code || firebaseError);
        throw new Error(`Firestore: ${firebaseError?.message || firebaseError?.code || 'Erro desconhecido'}`);
      }

      // Tentar sincronizar com Google Calendar se autorizado
      let calendarSyncSuccessful = false;
      if (this.googleAuthorized) {
        try {
          const googleEvent = this.buildGoogleEvent(novoAgendamento);
          console.log('Criando evento no Google Calendar:', googleEvent);
          
          await this.googleCalendarService.createEvent(googleEvent);
          calendarSyncSuccessful = true;
          
          const calendarToast = await this.toastCtrl.create({
            message: 'Evento criado também no Google Agenda.',
            duration: 2500,
            position: 'bottom',
            color: 'success'
          });
          await calendarToast.present();
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> ac6b18d (Danilo)
        } catch (googleError: any) {
          const googleErrorCode = googleError?.code || 'UNKNOWN';
          const googleErrorMsg = googleError?.message || 'Erro ao sincronizar com Google Agenda';
          
          console.error('⚠️ ERRO AO SINCRONIZAR COM GOOGLE CALENDAR:', {
            code: googleErrorCode,
            message: googleErrorMsg,
            fullError: googleError
          });
          
          const calendarWarningToast = await this.toastCtrl.create({
            message: `⚠️ Google Calendar: ${googleErrorMsg}. O agendamento foi criado localmente.`,
            duration: 5000,
<<<<<<< HEAD
=======
        } catch (error: any) {
          console.error('Erro ao criar evento no Google Agenda:', error, error?.error ?? error);
          const message = error?.status === 400
            ? 'Erro 400 no Google Agenda. Verifique se o token é válido e se as URLs estão autorizadas.'
            : 'Não foi possível salvar no Google Agenda. O agendamento foi criado localmente.';
          const calendarError = await this.toastCtrl.create({
            message,
            duration: 4000,
>>>>>>> 70b41d3 (Danilo)
=======
>>>>>>> ac6b18d (Danilo)
            position: 'bottom',
            color: 'warning'
          });
          await calendarWarningToast.present();
          
          // Não interromper o fluxo - agendamento local foi criado
        }
      } else {
        console.log('Google Calendar não autorizado. Agendamento criado apenas localmente.');
      }

      // Mostrar sucesso
      const toast = await this.toastCtrl.create({
        message: '✅ Agendamento confirmado com sucesso!',
        duration: 2500,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      
      // Navegar para proximas consultas
      this.router.navigate(['/proximas-consultas']);
    } catch (error: any) {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Erro ao agendar consulta. Tente novamente.';
      
      console.error('❌ ERRO AO AGENDAR:', {
        code: errorCode,
        message: errorMessage,
        fullError: error
      });
      
      // Mostrar se é erro de Firestore ou Google Calendar
      if (errorCode === 'permission-denied') {
        this.errorMessage = `❌ Permissão negada no Firestore. Verifique as regras de segurança.`;
      } else if (errorMessage.includes('Google') || errorMessage.includes('Calendar')) {
        this.errorMessage = `❌ Erro Google Calendar: ${errorMessage}`;
      } else {
        this.errorMessage = `❌ ${errorMessage}`;
      }
      
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 4000,
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> ac6b18d (Danilo)
      // Fazer logout primeiro se já estava conectado (para forçar seleção de email)
      if (this.googleAuthorized) {
        this.googleCalendarService.logout();
        this.googleAuthorized = false;
      }

<<<<<<< HEAD
      const returnUrl = window.location.pathname + window.location.search;
      console.log('Iniciando autorização do Google Calendar, returnUrl=', returnUrl);
      
      // Mostrar loading durante o redirecionamento
      const loading = await this.toastCtrl.create({
        message: 'Redirecionando para Google Calendar...',
        duration: 2000
      });
      await loading.present();
      
      await this.googleCalendarService.authorize(returnUrl);
      // Nota: A página será redirecionada, então o resto do código não será executado
    } catch (error: any) {
      const errorMsg = error?.message || 'Erro desconhecido';
      console.error('Erro ao iniciar autorização do Google Calendar:', errorMsg);
      
      this.errorMessage = `Não foi possível conectar ao Google Calendar: ${errorMsg}`;
      
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
        duration: 4000,
=======
=======
>>>>>>> ac6b18d (Danilo)
      const returnUrl = window.location.pathname + window.location.search;
      console.log('Iniciando autorização do Google Calendar, returnUrl=', returnUrl);
      
      // Mostrar loading durante o redirecionamento
      const loading = await this.toastCtrl.create({
        message: 'Redirecionando para Google Calendar...',
        duration: 2000
      });
      await loading.present();
      
      await this.googleCalendarService.authorize(returnUrl);
      // Nota: A página será redirecionada, então o resto do código não será executado
    } catch (error: any) {
      const errorMsg = error?.message || 'Erro desconhecido';
      console.error('Erro ao iniciar autorização do Google Calendar:', errorMsg);
      
      this.errorMessage = `Não foi possível conectar ao Google Calendar: ${errorMsg}`;
      
      const toast = await this.toastCtrl.create({
        message: this.errorMessage,
<<<<<<< HEAD
        duration: 3000,
>>>>>>> 70b41d3 (Danilo)
=======
        duration: 4000,
>>>>>>> ac6b18d (Danilo)
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isConnecting = false;
    }
<<<<<<< HEAD
  }

  async desconectarGoogleAgenda() {
    this.googleCalendarService.logout();
    this.googleAuthorized = false;
    
    const toast = await this.toastCtrl.create({
      message: 'Desconectado do Google Calendar. Você pode conectar com outra conta.',
      duration: 3000,
      color: 'success'
    });
    await toast.present();
=======
>>>>>>> 70b41d3 (Danilo)
  }

  async desconectarGoogleAgenda() {
    this.googleCalendarService.logout();
    this.googleAuthorized = false;
    
    const toast = await this.toastCtrl.create({
      message: 'Desconectado do Google Calendar. Você pode conectar com outra conta.',
      duration: 3000,
      color: 'success'
    });
    await toast.present();
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

  private buildDateTime(dateValue: string, timeValue: string): Date | null {

      if (!dateValue || !timeValue) {
        return null;
      }

      const cleanedDate = dateValue.trim();
      const cleanedTime = timeValue.trim();
      console.debug('buildDateTime values', { cleanedDate, cleanedTime });

      // Caso 1: timeValue já seja um ISO completo (ex: 2026-06-11T10:30:00)
      if (/T/.test(cleanedTime) && !isNaN(new Date(cleanedTime).getTime())) {
        return new Date(cleanedTime);
      }

      // Caso 2: dateValue é ISO completo com T
      if (/T/.test(cleanedDate) && !isNaN(new Date(cleanedDate).getTime())) {
        const base = new Date(cleanedDate);
        const tm = cleanedTime.match(/T?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (tm) {
          base.setHours(Number(tm[1]), Number(tm[2]), Number(tm[3] || '0'), 0);
        }
        return base;
      }

      // Extrai hora (aceita formatos como '10:30', 'T10:30:00')
      const timeMatch = cleanedTime.match(/T?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!timeMatch) {
        console.warn('buildDateTime: hora inválida', cleanedTime);
        return null;
      }

      try {
        // Fazer logout primeiro se já estava conectado (para forçar seleção de email)
        if (this.googleAuthorized) {
          this.googleCalendarService.logout();
          this.googleAuthorized = false;
        }

        const returnUrl = window.location.pathname + window.location.search;
        console.log('Iniciando autorização do Google Calendar, returnUrl=', returnUrl);

        const loading = await this.toastCtrl.create({ message: 'Redirecionando para Google Calendar...', duration: 2000 });
        await loading.present();

        await this.googleCalendarService.authorize(returnUrl);
        // A página será redirecionada pelo fluxo de autorização
      } catch (error: any) {
        const errorMsg = error?.message || 'Erro desconhecido';
        console.error('Erro ao iniciar autorização do Google Calendar:', errorMsg);

        this.errorMessage = `Não foi possível conectar ao Google Calendar: ${errorMsg}`;
        const toast = await this.toastCtrl.create({ message: this.errorMessage, duration: 4000, color: 'danger' });
        await toast.present();
      } finally {
        this.isConnecting = false;
      }
    }

    async desconectarGoogleAgenda() {
      this.googleCalendarService.logout();
      this.googleAuthorized = false;

      const toast = await this.toastCtrl.create({ message: 'Desconectado do Google Calendar. Você pode conectar com outra conta.', duration: 3000, color: 'success' });
      await toast.present();
    }