import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-resultado-partido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resultado-partido.component.html',
  styleUrls: ['./resultado-partido.component.css']
})
export class ResultadoPartidoComponent {
  equipo1Nombre: string = 'Equipo 1';
  equipo2Nombre: string = 'Equipo 2';
  equipo1Puntos: number = 0;
  equipo2Puntos: number = 0;
  equipo1Sets: number = 0;
  equipo2Sets: number = 0;
  mostrarModalReset: boolean = false;
  mostrarModalVolver: boolean = false;
  
  incrementarPuntos(equipo: number): void {
    if (equipo === 1) {
      this.equipo1Puntos++;
    } else {
      this.equipo2Puntos++;
    }
  }

  decrementarPuntos(equipo: number): void {
    if (equipo === 1 && this.equipo1Puntos > 0) {
      this.equipo1Puntos--;
    } else if (equipo === 2 && this.equipo2Puntos > 0) {
      this.equipo2Puntos--;
    }
 
  }

  abrirModalReset(): void {
    this.mostrarModalReset = true;
  }

  cerrarModalReset(): void {
    this.mostrarModalReset = false;
  }

  confirmarReset(): void {
    this.equipo1Puntos = 0;
    this.equipo2Puntos = 0;
    this.equipo1Sets = 0;
    this.equipo2Sets = 0;
    this.mostrarModalReset = false;
  }

  incrementarSet(equipo: number): void {
    if (equipo === 1) {
      this.equipo1Sets++;
    } else {
      this.equipo2Sets++;
    }
    // Resetear puntos al ganar un set
    this.equipo1Puntos = 0;
    this.equipo2Puntos = 0;
  }

  decrementarSet(equipo: number): void {
    if (equipo === 1 && this.equipo1Sets > 0) {
      this.equipo1Sets--;
    } else if (equipo === 2 && this.equipo2Sets > 0) {
      this.equipo2Sets--;
    }
  }

  abrirModalVolver(): void {
    this.mostrarModalVolver = true;
  }

  cerrarModalVolver(): void {
    this.mostrarModalVolver = false;
  }

}
