import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-paciente',
  templateUrl: './perfil-paciente.page.html',
  styleUrls: ['./perfil-paciente.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PerfilPacientePage implements OnInit {

  user: any;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    console.log('USUÁRIO:', this.user);
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

  psicologos: any[] = [];
  mostrarLista: boolean = false;

  carregarPsicologos() {
  if (this.mostrarLista) {
    this.mostrarLista = false;
    return;
  }

  this.auth.getPsicologos().subscribe((data: any) => {
    this.psicologos = data;
    this.mostrarLista = true;
  });
}
}