import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  JUGADORES_EJEMPLO,
  Jugador,
  OrganizadorEquiposService,
  Posicion,
  ResultadoOrganizacion,
} from '../services/organizador-equipos.service';

interface JugadorUI extends Jugador {
  isPresent: boolean;
}

@Component({
  selector: 'app-organizador-v2',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './organizador-v2.component.html',
  styleUrls: ['./organizador-v2.component.css'],
})
export class OrganizadorV2Component implements OnInit {
  readonly STORAGE_KEY = 'jugadoresVoleyV2';

  readonly POSICIONES: Posicion[] = ['punta', 'central', 'levantador', 'opuesto'];

  readonly NIVELES = [
    { value: 1, label: 'Recién empieza a jugar' },
    { value: 2, label: 'Lleva un tiempo aprendiendo' },
    { value: 3, label: 'Terminando de aprender lo básico' },
    { value: 4, label: 'Sabe jugar' },
    { value: 5, label: 'Sabe jugar y es alto' },
    { value: 6, label: 'Sabe jugar, bloquea, remata, saca bien' },
    { value: 7, label: 'Juega bien en todas las posiciones' },
  ];

  jugadoresBase: JugadorUI[] = [];
  numeroEquipos = 3;
  resultado: ResultadoOrganizacion | null = null;
  errorMsg = '';
  mostrarFormAgregar = false;
  editandoId: number | null = null;

  nuevoNombre = '';
  nuevoPuntaje: number = 4;
  nuevasPosiciones: Array<Posicion | ''> = ['punta', 'central', '', ''];

  editNombre = '';
  editPuntaje: number = 4;
  editPosiciones: Array<Posicion | ''> = ['punta', 'central', '', ''];

  constructor(private organizadorService: OrganizadorEquiposService) {}

  ngOnInit(): void {
    this.jugadoresBase = this.cargarJugadores();
  }

  cargarJugadores(): JugadorUI[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      return JSON.parse(data).map((jugador: JugadorUI) => this.normalizarJugadorUI(jugador));
    }
    return JUGADORES_EJEMPLO.map((j) => this.normalizarJugadorUI({ ...j, isPresent: true }));
  }

  guardarJugadores(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.jugadoresBase));
  }

  jugadoresPresentes(): number {
    return this.jugadoresBase.filter((j) => j.isPresent).length;
  }

  agregarJugador(): void {
    if (!this.nuevoNombre.trim()) {
      this.errorMsg = 'Ingrese un nombre válido.';
      return;
    }
    const posiciones = this.posicionesSeleccionadas();

    if (posiciones.length < 2) {
      this.errorMsg = 'Seleccione al menos dos posiciones distintas.';
      return;
    }
    if (this.jugadoresBase.some((j) => j.nombre.toLowerCase() === this.nuevoNombre.trim().toLowerCase())) {
      this.errorMsg = 'Ese jugador ya está en la lista.';
      return;
    }

    const nuevoId = this.jugadoresBase.reduce((max, j) => Math.max(max, j.id), 0) + 1;
    this.jugadoresBase.push({
      id: nuevoId,
      nombre: this.nuevoNombre.trim(),
      puntaje: Number(this.nuevoPuntaje) as any,
      posiciones,
      isPresent: true,
    });

    this.guardarJugadores();
    this.nuevoNombre = '';
    this.nuevoPuntaje = 4;
    this.nuevasPosiciones = ['punta', 'central', '', ''];
    this.errorMsg = '';
    this.mostrarFormAgregar = false;
  }

  borrarJugador(id: number): void {
    const jugador = this.jugadoresBase.find((j) => j.id === id);
    if (!jugador) return;
    if (!confirm(`¿Eliminar a ${jugador.nombre}?`)) return;
    this.jugadoresBase = this.jugadoresBase.filter((j) => j.id !== id);
    this.guardarJugadores();
  }

  generarEquipos(): void {
    this.errorMsg = '';
    this.resultado = null;

    const jugadoresPresentes = this.jugadoresBase
      .filter((j) => j.isPresent)
      .map(({ isPresent, ...j }) => j);

    if (jugadoresPresentes.length < this.numeroEquipos) {
      this.errorMsg = 'Debe haber al menos un jugador por equipo.';
      return;
    }

    try {
      this.resultado = this.organizadorService.organizarEquipos(jugadoresPresentes, this.numeroEquipos);
      this.resultado.equipos.sort(() => Math.random() - 0.5);
    } catch (e: any) {
      this.errorMsg = e.message ?? 'Error al generar equipos.';
    }
  }

  posicionEmoji(posicion: Posicion): string {
    const map: Record<Posicion, string> = {
      levantador: '🧤',
      opuesto: '⚡',
      central: '🧱',
      punta: '↗️',
    };
    return map[posicion] ?? '';
  }

  resetearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.jugadoresBase = JUGADORES_EJEMPLO.map((j) => this.normalizarJugadorUI({ ...j, isPresent: true }));
    this.resultado = null;
    this.errorMsg = '';
  }

  posicionesJugador(jugador: Jugador): Posicion[] {
    if (Array.isArray(jugador.posiciones) && jugador.posiciones.length > 0) {
      return jugador.posiciones as Posicion[];
    }

    return [jugador.posicionPrincipal, jugador.posicionSecundaria].filter(Boolean) as Posicion[];
  }

  posicionColorClass(pos: string): string {
    const normalized = pos.toLowerCase().replace('centro', 'central');
    const map: Record<string, string> = {
      levantador: 'bg-purple-100 text-purple-700',
      opuesto: 'bg-red-100 text-red-700',
      central: 'bg-blue-100 text-blue-700',
      punta: 'bg-green-100 text-green-700',
    };
    return map[normalized] ?? 'bg-gray-100 text-gray-700';
  }

  posicionLabel(posicion: Posicion): string {
    return posicion === 'central' ? 'centro' : posicion;
  }

  jugadoresOrdenadosPorPosicion(jugadores: any[]): any[] {
    return [...jugadores].sort(() => Math.random() - 0.5);
  }

  iniciarEdicion(jugador: JugadorUI): void {
    this.editandoId = jugador.id;
    this.editNombre = jugador.nombre;
    this.editPuntaje = jugador.puntaje as unknown as number;
    const pos = this.posicionesJugador(jugador);
    this.editPosiciones = [
      pos[0] ?? '',
      pos[1] ?? '',
      pos[2] ?? '',
      pos[3] ?? '',
    ] as Array<Posicion | ''>;
  }

  cancelarEdicion(): void {
    this.editandoId = null;
  }

  guardarEdicion(id: number): void {
    if (!this.editNombre.trim()) {
      this.errorMsg = 'El nombre no puede estar vacío.';
      return;
    }
    const posiciones = [...new Set(this.editPosiciones.filter((p): p is Posicion => !!p))];
    if (posiciones.length < 2) {
      this.errorMsg = 'Seleccione al menos dos posiciones distintas.';
      return;
    }
    const jugador = this.jugadoresBase.find((j) => j.id === id);
    if (!jugador) return;
    jugador.nombre = this.editNombre.trim();
    jugador.puntaje = Number(this.editPuntaje) as any;
    jugador.posiciones = posiciones;
    this.guardarJugadores();
    this.editandoId = null;
    this.errorMsg = '';
  }

  private posicionesSeleccionadas(): Posicion[] {
    return [...new Set(this.nuevasPosiciones.filter((posicion): posicion is Posicion => !!posicion))];
  }

  private normalizarJugadorUI(jugador: JugadorUI): JugadorUI {
    return {
      ...jugador,
      puntaje: Number(jugador.puntaje) as any,
      posiciones: this.posicionesJugador(jugador),
      posicionPrincipal: undefined,
      posicionSecundaria: undefined,
      isPresent: jugador.isPresent ?? true,
    };
  }
}
