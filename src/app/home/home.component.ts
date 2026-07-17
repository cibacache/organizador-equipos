import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PaginaMenu {
  ruta: string;
  icono: string;
  titulo: string;
  descripcion: string;
  color: 'accent' | 'teal';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly paginas: PaginaMenu[] = [
    {
      ruta: '/organizador',
      icono: '🏐',
      titulo: 'Organizador',
      descripcion: 'Armado de equipos por puntaje y capitanes',
      color: 'accent',
    },
    {
      ruta: '/organizadorv2',
      icono: '⚙️',
      titulo: 'Organizador V2',
      descripcion: 'Armado de equipos por posiciones en cancha',
      color: 'teal',
    },
    {
      ruta: '/resultado',
      icono: '📋',
      titulo: 'Resultado',
      descripcion: 'Marcador en vivo del partido',
      color: 'accent',
    },
    {
      ruta: '/pizarra',
      icono: '🧠',
      titulo: 'Pizarra',
      descripcion: 'Pizarra táctica y registro de saques/recepciones',
      color: 'teal',
    },
  ];
}
