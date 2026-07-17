import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-resultado-partido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './resultado-partido.component.html',
  styleUrls: ['./resultado-partido.component.css']
})
export class ResultadoPartidoComponent implements OnInit, OnDestroy {
  equipo1Nombre: string = 'Equipo 1';
  equipo2Nombre: string = 'Equipo 2';
  equipo1Puntos: number = 0;
  equipo2Puntos: number = 0;
  equipo1Sets: number = 0;
  equipo2Sets: number = 0;
  mostrarModalReset: boolean = false;
  mostrarModalVolver: boolean = false;

  /** true si la pantalla se está manteniendo encendida (Wake Lock API o fallback de video) */
  pantallaActiva = false;

  private wakeLock: any = null;
  private fallbackVideo: HTMLVideoElement | null = null;
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.pantallaActiva && !this.wakeLock) {
      this.activarWakeLockNativo();
    }
  };

  ngOnInit(): void {
    this.activarPantallaActiva();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.liberarPantallaActiva();
  }

  /** Alterna el bloqueo de pantalla manualmente (botón en el header) */
  toggleWakeLock(): void {
    if (this.pantallaActiva) {
      this.liberarPantallaActiva();
    } else {
      this.activarPantallaActiva();
    }
  }

  private async activarPantallaActiva(): Promise<void> {
    const activado = await this.activarWakeLockNativo();
    if (!activado) {
      this.activarFallbackVideo();
    }
  }

  /** Wake Lock API estándar (Chrome, y Safari/Chrome iOS 16.4+) */
  private async activarWakeLockNativo(): Promise<boolean> {
    if (!('wakeLock' in navigator)) {
      return false;
    }

    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      this.pantallaActiva = true;
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  /** Fallback para iPhones con iOS < 16.4: video mudo en loop generado desde un canvas */
  private activarFallbackVideo(): void {
    if (this.fallbackVideo) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const stream: MediaStream | undefined = (canvas as any).captureStream?.(1);
    if (!stream) {
      return;
    }

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.loop = true;
    video.style.position = 'fixed';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    this.fallbackVideo = video;

    video.play()
      .then(() => (this.pantallaActiva = true))
      .catch(() => this.liberarPantallaActiva());
  }

  private liberarPantallaActiva(): void {
    this.wakeLock?.release?.();
    this.wakeLock = null;

    if (this.fallbackVideo) {
      this.fallbackVideo.pause();
      this.fallbackVideo.remove();
      this.fallbackVideo = null;
    }

    this.pantallaActiva = false;
  }

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
  }

  decrementarSet(equipo: number): void {
    if (equipo === 1 && this.equipo1Sets > 0) {
      this.equipo1Sets--;
    } else if (equipo === 2 && this.equipo2Sets > 0) {
      this.equipo2Sets--;
    }
  }

  intercambiarResultados(): void {
    // Intercambiar puntos
    const tempPuntos = this.equipo1Puntos;
    this.equipo1Puntos = this.equipo2Puntos;
    this.equipo2Puntos = tempPuntos;

    // Intercambiar sets
    const tempSets = this.equipo1Sets;
    this.equipo1Sets = this.equipo2Sets;
    this.equipo2Sets = tempSets;

    // Intercambiar nombres
    const tempNombre = this.equipo1Nombre;
    this.equipo1Nombre = this.equipo2Nombre;
    this.equipo2Nombre = tempNombre;
  
    }
  

  abrirModalVolver(): void {
    this.mostrarModalVolver = true;
  }

  cerrarModalVolver(): void {
    this.mostrarModalVolver = false;
  }

  resetearMarcadorFinSet(): void {
    this.equipo1Puntos = 0;
    this.equipo2Puntos = 0;
  }

}
