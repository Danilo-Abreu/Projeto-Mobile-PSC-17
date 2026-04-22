import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-psicologo',
  templateUrl: './perfil-psicologo.page.html',
  styleUrls: ['./perfil-psicologo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PerfilPsicologoPage implements OnInit {

  user: any;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
  }

  async tirarFoto() {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt
    });

    const fotoBase64 = image.dataUrl;

    // atualiza usuário local
    this.user.foto = fotoBase64;

    // salva no "banco"
    await this.auth.updateUser(this.user);

    console.log('Foto salva com sucesso!');

  } catch (error) {
    console.error('Erro ao tirar foto:', error);
  }
}

logout() {
  this.auth.logout();
  this.router.navigate(['/login']);
}

}