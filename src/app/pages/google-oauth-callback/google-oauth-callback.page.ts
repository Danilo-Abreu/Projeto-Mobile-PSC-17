import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { GoogleCalendarService } from 'src/app/services/google-calendar.service';

@Component({
  selector: 'app-google-oauth-callback',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Conectando ao Google Agenda</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="callback-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>{{ message }}</p>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .callback-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
      }
      ion-spinner {
        margin-bottom: 20px;
      }
    `
  ]
})
export class GoogleOauthCallbackPage implements OnInit {
  message = 'Finalizando autenticação...';

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    const loading = await this.loadingCtrl.create({
      message: 'Aguarde...',
      spinner: 'crescent'
    });

    await loading.present();

    const returnUrl = await this.googleCalendarService.handleAuthCallback();
    await loading.dismiss();

    if (returnUrl) {
      const navigated = await this.router.navigateByUrl(returnUrl);
      if (navigated) {
        return;
      }
    }

    await this.toastCtrl.create({
      message: 'Autenticação concluída no Google Agenda.',
      duration: 2000,
      color: 'success'
    }).then(toast => toast.present());

    await this.router.navigateByUrl('/home');
  }
}
