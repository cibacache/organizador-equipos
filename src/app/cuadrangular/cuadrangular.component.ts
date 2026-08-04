import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import partidosData from '../../partidos.json';

interface EquipoPartido {
  nombre: string;
}

interface Partido {
  numero: number;
  inicio: string;
  fin: string;
  equipoA: EquipoPartido;
  equipoB: EquipoPartido;
  /** Puntos por set: [puntosEquipoA, puntosEquipoB]. Un set en [0, 0] significa que no se jugó. */
  set: number[][];
}

interface TorneoInfo {
  nombre: string;
  organizador: string;
  fecha: string;
  lugar: string;
}

interface PosicionEquipo {
  nombre: string;
  partidosJugados: number;
  partidosGanados: number;
  partidosPerdidos: number;
  setsFavor: number;
  setsContra: number;
  puntosFavor: number;
  puntosContra: number;
  puntos: number;
  coeficienteSets: number;
  coeficientePuntos: number;
}

interface ResultadoPartido {
  jugado: boolean;
  setsA: number;
  setsB: number;
  puntosA: number;
  puntosB: number;
  setsJugados: number[][];
}

@Component({
  selector: 'app-cuadrangular',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cuadrangular.component.html',
  styleUrl: './cuadrangular.component.css',
})
export class CuadrangularComponent {
  readonly torneo: TorneoInfo = partidosData.torneo;
  readonly partidos: Partido[] = partidosData.partidos;
  readonly posiciones: PosicionEquipo[];
  readonly torneoIniciado: boolean;

  constructor() {
    this.posiciones = this.calcularPosiciones();
    this.torneoIniciado = this.posiciones.some(p => p.partidosJugados > 0);
  }

  /** Un set en [0, 0] significa que todavía no se jugó */
  private resultado(partido: Partido): ResultadoPartido {
    const setsJugados = partido.set.filter(([puntosA, puntosB]) => puntosA !== 0 || puntosB !== 0);

    let setsA = 0;
    let setsB = 0;
    let puntosA = 0;
    let puntosB = 0;

    for (const [pA, pB] of setsJugados) {
      puntosA += pA;
      puntosB += pB;
      if (pA > pB) setsA++;
      else if (pB > pA) setsB++;
    }

    return { jugado: setsA >= 2 || setsB >= 2, setsA, setsB, puntosA, puntosB, setsJugados };
  }

  private calcularPosiciones(): PosicionEquipo[] {
    const tabla = new Map<string, PosicionEquipo>();
    const asegurarEquipo = (nombre: string): PosicionEquipo => {
      let equipo = tabla.get(nombre);
      if (!equipo) {
        equipo = {
          nombre,
          partidosJugados: 0,
          partidosGanados: 0,
          partidosPerdidos: 0,
          setsFavor: 0,
          setsContra: 0,
          puntosFavor: 0,
          puntosContra: 0,
          puntos: 0,
          coeficienteSets: 0,
          coeficientePuntos: 0,
        };
        tabla.set(nombre, equipo);
      }
      return equipo;
    };

    // Head-to-head: resultado directo entre dos equipos (para desempate 3.4)
    const enfrentamientos = new Map<string, string>();

    for (const partido of this.partidos) {
      const a = asegurarEquipo(partido.equipoA.nombre);
      const b = asegurarEquipo(partido.equipoB.nombre);
      const { jugado, setsA, setsB, puntosA, puntosB } = this.resultado(partido);

      if (!jugado) {
        continue;
      }

      a.partidosJugados++;
      b.partidosJugados++;
      a.setsFavor += setsA;
      a.setsContra += setsB;
      b.setsFavor += setsB;
      b.setsContra += setsA;
      a.puntosFavor += puntosA;
      a.puntosContra += puntosB;
      b.puntosFavor += puntosB;
      b.puntosContra += puntosA;

      const ganador = setsA > setsB ? a : b;
      const perdedor = ganador === a ? b : a;
      const setsGanador = Math.max(setsA, setsB);
      const setsPerdedor = Math.min(setsA, setsB);

      ganador.partidosGanados++;
      perdedor.partidosPerdidos++;

      // 3.3 Puntuación: 2-0 -> 3/0 puntos; 2-1 -> 2/1 puntos
      if (setsGanador === 2 && setsPerdedor === 0) {
        ganador.puntos += 3;
      } else {
        ganador.puntos += 2;
        perdedor.puntos += 1;
      }

      enfrentamientos.set(`${ganador.nombre}|${perdedor.nombre}`, ganador.nombre);
      enfrentamientos.set(`${perdedor.nombre}|${ganador.nombre}`, ganador.nombre);
    }

    for (const equipo of tabla.values()) {
      equipo.coeficienteSets = equipo.setsContra > 0
        ? equipo.setsFavor / equipo.setsContra
        : (equipo.setsFavor > 0 ? Infinity : 0);
      equipo.coeficientePuntos = equipo.puntosContra > 0
        ? equipo.puntosFavor / equipo.puntosContra
        : (equipo.puntosFavor > 0 ? Infinity : 0);
    }

    // 3.4 Desempate: PG > Coef. Sets > Coef. Puntos > enfrentamiento directo
    return Array.from(tabla.values()).sort((x, y) => {
      if (y.puntos !== x.puntos) return y.puntos - x.puntos;
      if (y.partidosGanados !== x.partidosGanados) return y.partidosGanados - x.partidosGanados;
      if (y.coeficienteSets !== x.coeficienteSets) return y.coeficienteSets - x.coeficienteSets;
      if (y.coeficientePuntos !== x.coeficientePuntos) return y.coeficientePuntos - x.coeficientePuntos;
      const directo = enfrentamientos.get(`${x.nombre}|${y.nombre}`);
      if (directo === x.nombre) return -1;
      if (directo === y.nombre) return 1;
      return 0;
    });
  }

  resultadoPartido(partido: Partido): string {
    const { jugado, setsA, setsB } = this.resultado(partido);
    return jugado ? `${setsA} - ${setsB}` : 'Pendiente';
  }

  setsTexto(partido: Partido): string[] {
    return this.resultado(partido).setsJugados.map(([pA, pB]) => `${pA}-${pB}`);
  }

  estaJugado(partido: Partido): boolean {
    return this.resultado(partido).jugado;
  }

  esGanador(partido: Partido, equipo: 'A' | 'B'): boolean {
    const r = this.resultado(partido);
    if (!r.jugado) return false;
    return equipo === 'A' ? r.setsA > r.setsB : r.setsB > r.setsA;
  }

  formatCoeficiente(valor: number): string {
    return valor === Infinity ? '∞' : valor.toFixed(2);
  }
}
