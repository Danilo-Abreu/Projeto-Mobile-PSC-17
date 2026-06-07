import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Adicione CurrencyPipe
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Adicione RouterLink
import { DataService, Psicologo } from 'src/app/services/data.service';

@Component({
  selector: 'app-detalhes-psicologo',
  templateUrl: './detalhes-psicologo.page.html',
  styleUrls: ['./detalhes-psicologo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, CurrencyPipe] // Adicione RouterLink e CurrencyPipe
})
export class DetalhesPsicologoPage implements OnInit {
  psicologo: Psicologo | undefined;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
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
    this.dataService.getPsicologoById(id).subscribe(data => {
      this.psicologo = data;
      this.isLoading = false;
    });
  }

  agendar() {
    if (this.psicologo) {
      // Navega para a sua página de agendamento existente, passando o e-mail
      this.router.navigate(['/agendar-consulta', this.psicologo.email]);
    }
  }
}