import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PsicologoService } from '../../services/psicologo.service';

@Component({
  selector: 'app-perfil-paciente',
  templateUrl: './perfil-paciente.page.html',
  styleUrls: ['./perfil-paciente.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class PerfomPacientePage implements OnInit {
  searchTerm = '';
  psicologos: any[] = [];
  psicologosFiltrados: any[] = [];

  constructor(private psicologoService: PsicologoService) {}

  ngOnInit() {
    this.carregarPsicologos();
  }

  carregarPsicologos() {
    this.psicologoService.obterTodos().subscribe((dados: any[]) => {
      this.psicologos = dados;
      this.psicologosFiltrados = dados;
    });
  }

  filtrarPsicologos() {
    const termo = this.searchTerm.toLowerCase();
    this.psicologosFiltrados = this.psicologos.filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      p.especialidade.toLowerCase().includes(termo)
    );
  }

  agendar(psicologo: any) {
    // Lógica para agendar
    console.log('Agendando com:', psicologo);
  }
}