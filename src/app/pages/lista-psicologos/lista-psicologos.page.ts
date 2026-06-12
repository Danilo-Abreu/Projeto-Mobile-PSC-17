import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PsicologoService } from 'src/app/services/psicologo.service';

@Component({
  selector: 'app-lista-psicologos',
  templateUrl: './lista-psicologos.page.html',
  styleUrls: ['./lista-psicologos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class ListaPsicologosPage implements OnInit {
  psicologos: any[] = [];
  allPsicologos: any[] = [];
  isLoading: boolean = true;

  constructor(
    private psicologoService: PsicologoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarPsicologos();
  }

  carregarPsicologos() {
    this.isLoading = true;
    this.psicologoService.obterTodos().subscribe(data => {
      this.allPsicologos = data || [];
      this.psicologos = [...this.allPsicologos];
      this.isLoading = false;
    }, error => {
      console.error('Erro ao carregar psicólogos:', error);
      this.allPsicologos = [];
      this.psicologos = [];
      this.isLoading = false;
    });
  }

  onSearchChange(event: any) {
    const termo = event.target.value?.toString().trim().toLowerCase();

    if (termo) {
      this.psicologos = this.allPsicologos.filter(psicologo => {
        const nome = psicologo.nome?.toString().toLowerCase() || '';
        const especialidade = psicologo.especialidade?.toString().toLowerCase() || '';
        return nome.includes(termo) || especialidade.includes(termo);
      });
    } else {
      this.psicologos = [...this.allPsicologos];
    }
  }

  verDetalhes(id: string) {
    this.router.navigate(['/detalhes-psicologo', id]);
  }
}