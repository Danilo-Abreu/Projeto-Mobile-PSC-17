import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Adicione CurrencyPipe
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // Adicione RouterLink
import { DataService, Psicologo } from 'src/app/services/data.service';

@Component({
  selector: 'app-lista-psicologos',
  templateUrl: './lista-psicologos.page.html',
  styleUrls: ['./lista-psicologos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink, CurrencyPipe] // Adicione RouterLink e CurrencyPipe
})
export class ListaPsicologosPage implements OnInit {
  psicologos: Psicologo[] = [];
  isLoading: boolean = true;

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarPsicologos();
  }

  carregarPsicologos() {
    this.isLoading = true;
    this.dataService.getPsicologos().subscribe(data => {
      this.psicologos = data;
      this.isLoading = false;
    });
  }

  onSearchChange(event: any) {
    const termo = event.target.value;
    this.isLoading = true;
    
    if (termo && termo.trim() !== '') {
      this.dataService.buscarPsicologos(termo).subscribe(data => {
        this.psicologos = data;
        this.isLoading = false;
      });
    } else {
      this.carregarPsicologos();
    }
  }

  verDetalhes(id: string) {
    this.router.navigate(['/detalhes-psicologo', id]);
  }
}