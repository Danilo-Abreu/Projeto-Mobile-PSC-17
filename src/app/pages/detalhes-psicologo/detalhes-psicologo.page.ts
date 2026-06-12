import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PsicologoService } from 'src/app/services/psicologo.service';

@Component({
  selector: 'app-detalhes-psicologo',
  templateUrl: './detalhes-psicologo.page.html',
  styleUrls: ['./detalhes-psicologo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, CurrencyPipe]
})
export class DetalhesPsicologoPage implements OnInit {
  psicologo: any | undefined;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private psicologoService: PsicologoService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarDetalhes(id);
    } else {
      this.isLoading = false;
    }
  }

  carregarDetalhes(id: string) {
    this.isLoading = true;
    this.psicologoService.obterPorId(id).subscribe(data => {
      this.psicologo = data;
      this.isLoading = false;
    }, error => {
      console.error('Erro ao carregar detalhes do psicólogo:', error);
      this.isLoading = false;
    });
  }

  agendar() {
    if (this.psicologo && this.psicologo.email) {
      console.log('Navegando para agendar com psicólogo:', this.psicologo.email);
      this.router.navigate(['/agendar-consulta', this.psicologo.email]);
    } else {
      console.error('Email do psicólogo não disponível');
    }
  }
}