import { Injectable } from '@angular/core';

export type Posicion = 'punta' | 'central' | 'levantador' | 'opuesto' | 'suplente';

export interface Jugador {
  id: number;
  nombre: string;
  puntaje: NivelJuego;
  posiciones: Array<Posicion | string>;
  posicionPrincipal?: Posicion | string;
  posicionSecundaria?: Posicion | string;
}

export type NivelJuego = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface JugadorAsignado extends Jugador {
  posicionAsignada: Posicion;
}

export interface Equipo {
  id: number;
  nombre: string;
  jugadores: JugadorAsignado[];
  puntajeTotal: number;
  puntajePromedio: number;
  posiciones: Record<Posicion, number>;
}

export interface ResultadoOrganizacion {
  equipos: Equipo[];
  resumen: {
    puntajeMinimo: number;
    puntajeMaximo: number;
    diferenciaPuntaje: number;
    promedioMinimo: number;
    promedioMaximo: number;
    diferenciaPromedio: number;
  };
}

export interface SolicitudOrganizacionEquipos {
  numeroJugadores: number;
  numeroEquipos: number;
  jugadores: Jugador[];
}

interface EquipoEnConstruccion {
  id: number;
  nombre: string;
  jugadores: Jugador[];
  puntajeTotal: number;
  posiciones: Record<Posicion, number>;
  cupoMaximo: number;
}

interface AsignacionEvaluada {
  equipo: EquipoEnConstruccion;
  costo: number;
}

const POSICIONES_VALIDAS: Posicion[] = ['punta', 'central', 'levantador', 'opuesto'];
const FORMACION_VOLLEY: Record<Posicion, number> = {
  levantador: 1,
  opuesto: 1,
  central: 2,
  punta: 2,
  suplente: 0,
};

const PRIORIDAD_POSICIONES: Posicion[] = ['levantador', 'central', 'punta', 'opuesto'];

@Injectable({
  providedIn: 'root',
})
export class OrganizadorEquiposService {
  organizarDesdeSolicitud(solicitud: SolicitudOrganizacionEquipos): ResultadoOrganizacion {
    if (!Number.isInteger(solicitud.numeroJugadores) || solicitud.numeroJugadores < 1) {
      throw new Error('El numero de jugadores debe ser un entero mayor a 0.');
    }

    if (solicitud.numeroJugadores !== solicitud.jugadores.length) {
      throw new Error('El numero de jugadores no coincide con la cantidad de jugadores en la lista.');
    }

    return this.organizarEquipos(solicitud.jugadores, solicitud.numeroEquipos);
  }

  organizarEquipos(jugadores: Jugador[], numeroEquipos: number): ResultadoOrganizacion {
    this.validarEntrada(jugadores, numeroEquipos);

    const jugadoresNormalizados = jugadores.map((jugador) => this.normalizarJugador(jugador));
    const equipos = this.crearEquipos(numeroEquipos, jugadoresNormalizados.length);
    const jugadoresOrdenados = this.ordenarJugadoresParaAsignacion(jugadoresNormalizados);

    for (const jugador of jugadoresOrdenados) {
      const mejorAsignacion = this.buscarMejorEquipoParaJugador(jugador, equipos);
      mejorAsignacion.equipo.jugadores.push(jugador);
      mejorAsignacion.equipo.puntajeTotal += jugador.puntaje;
      mejorAsignacion.equipo.posiciones[this.obtenerPosicionPrincipal(jugador)] += 1;
    }

    return this.construirResultado(equipos);
  }

  private validarEntrada(jugadores: Jugador[], numeroEquipos: number): void {
    if (!Number.isInteger(numeroEquipos) || numeroEquipos < 2) {
      throw new Error('El numero de equipos debe ser un entero mayor o igual a 2.');
    }

    if (!Array.isArray(jugadores) || jugadores.length === 0) {
      throw new Error('La lista de jugadores es requerida.');
    }

    if (jugadores.length < numeroEquipos) {
      throw new Error('Debe existir al menos un jugador por equipo.');
    }

    for (const jugador of jugadores) {
      if (!jugador.nombre?.trim()) {
        throw new Error(`El jugador con id ${jugador.id} no tiene nombre.`);
      }

      if (!Number.isInteger(jugador.puntaje) || jugador.puntaje < 1 || jugador.puntaje > 7) {
        throw new Error(`El jugador ${jugador.nombre} tiene un puntaje invalido.`);
      }

      const posiciones = this.normalizarPosicionesJugador(jugador);

      if (posiciones.length < 2) {
        throw new Error(`El jugador ${jugador.nombre} debe tener al menos dos posiciones distintas.`);
      }
    }
  }

  private normalizarJugador(jugador: Jugador): Jugador {
    return {
      ...jugador,
      nombre: jugador.nombre.trim(),
      posiciones: this.normalizarPosicionesJugador(jugador),
      posicionPrincipal: undefined,
      posicionSecundaria: undefined,
    };
  }

  private normalizarPosicionesJugador(jugador: Jugador): Posicion[] {
    const posicionesOriginales =
      Array.isArray(jugador.posiciones) && jugador.posiciones.length > 0
        ? jugador.posiciones
        : [jugador.posicionPrincipal, jugador.posicionSecundaria];

    const posiciones = posicionesOriginales
      .filter((posicion): posicion is Posicion | string => posicion !== undefined && posicion !== null)
      .map((posicion) => this.normalizarPosicion(posicion, jugador.nombre));

    return [...new Set(posiciones)];
  }

  private normalizarPosicion(posicion: Posicion | string, nombreJugador: string): Posicion {
    const posicionNormalizada = posicion
      ?.toString()
      .trim()
      .toLowerCase()
      .replace('centro', 'central') as Posicion;

    if (!POSICIONES_VALIDAS.includes(posicionNormalizada)) {
      throw new Error(`La posicion "${posicion}" del jugador ${nombreJugador} no es valida.`);
    }

    return posicionNormalizada;
  }

  private crearEquipos(numeroEquipos: number, numeroJugadores: number): EquipoEnConstruccion[] {
    const cupoBase = Math.floor(numeroJugadores / numeroEquipos);
    const equiposConJugadorExtra = numeroJugadores % numeroEquipos;

    return Array.from({ length: numeroEquipos }, (_, index) => ({
      id: index + 1,
      nombre: `Equipo ${index + 1}`,
      jugadores: [],
      puntajeTotal: 0,
      posiciones: this.crearContadorPosiciones(),
      cupoMaximo: cupoBase + (index < equiposConJugadorExtra ? 1 : 0),
    }));
  }

  private crearContadorPosiciones(): Record<Posicion, number> {
    return {
      punta: 0,
      central: 0,
      levantador: 0,
      opuesto: 0,
      suplente: 0,
    };
  }

  private ordenarJugadoresParaAsignacion(jugadores: Jugador[]): Jugador[] {
    return [...jugadores].sort((a, b) => {
      if (b.puntaje !== a.puntaje) {
        return b.puntaje - a.puntaje;
      }

      return this.valorRarezaPosicion(b, jugadores) - this.valorRarezaPosicion(a, jugadores);
    });
  }

  private valorRarezaPosicion(jugador: Jugador, jugadores: Jugador[]): number {
    const posicionPrincipal = this.obtenerPosicionPrincipal(jugador);
    const cantidadMismaPrincipal = jugadores.filter(
      (otroJugador) => this.obtenerPosicionPrincipal(otroJugador) === posicionPrincipal,
    ).length;

    return jugadores.length - cantidadMismaPrincipal;
  }

  private buscarMejorEquipoParaJugador(
    jugador: Jugador,
    equipos: EquipoEnConstruccion[],
  ): AsignacionEvaluada {
    const candidatos = equipos
      .filter((equipo) => equipo.jugadores.length < equipo.cupoMaximo)
      .map((equipo) => ({
        equipo,
        costo: this.calcularCostoAsignacion(jugador, equipo, equipos),
      }))
      .sort((a, b) => a.costo - b.costo);

    if (!candidatos.length) {
      throw new Error('No quedan cupos disponibles para asignar jugadores.');
    }

    return candidatos[0];
  }

  private calcularCostoAsignacion(
    jugador: Jugador,
    equipoDestino: EquipoEnConstruccion,
    equipos: EquipoEnConstruccion[],
  ): number {
    const puntajesProyectados = equipos.map((equipo) =>
      equipo.id === equipoDestino.id ? equipo.puntajeTotal + jugador.puntaje : equipo.puntajeTotal,
    );

    const tamanosProyectados = equipos.map((equipo) =>
      equipo.id === equipoDestino.id ? equipo.jugadores.length + 1 : equipo.jugadores.length,
    );

    const promediosProyectados = puntajesProyectados.map((puntaje, index) =>
      tamanosProyectados[index] === 0 ? 0 : puntaje / tamanosProyectados[index],
    );

    const diferenciaPuntaje = Math.max(...puntajesProyectados) - Math.min(...puntajesProyectados);
    const diferenciaPromedio = Math.max(...promediosProyectados) - Math.min(...promediosProyectados);
    const penalizacionBajoNivel = this.calcularPenalizacionBajoNivel(jugador, equipoDestino);
    const penalizacionPosicion = this.calcularPenalizacionPosicion(jugador, equipoDestino);

    return diferenciaPuntaje * 2 + diferenciaPromedio * 3 + penalizacionBajoNivel + penalizacionPosicion * 15;
  }

  private calcularPenalizacionBajoNivel(jugador: Jugador, equipo: EquipoEnConstruccion): number {
    if (jugador.puntaje > 3) {
      return 0;
    }

    const jugadoresBajoNivel = equipo.jugadores.filter((integrante) => integrante.puntaje <= 3).length;

    return jugadoresBajoNivel * 4;
  }

  private calcularPenalizacionPosicion(jugador: Jugador, equipo: EquipoEnConstruccion): number {
    const posicionesJugador = this.obtenerPosiciones(jugador);
    const principal = posicionesJugador[0];
    
    // Comparar contra el límite de la formación (ej. 2 para central/punta, 1 para levantador/opuesto)
    const limitePosicion = FORMACION_VOLLEY[principal] ?? 1;
    const ocupacionPrincipal = equipo.posiciones[principal] ?? 0;
    const tienePrincipalExcedido = ocupacionPrincipal >= limitePosicion;

    const levantadoresActuales = equipo.jugadores.filter(
      (integrante) => this.obtenerPosiciones(integrante).includes('levantador'),
    ).length;
    const prioridadLevantador = posicionesJugador.indexOf('levantador');

    // Regla especial para colocadores (levantadores)
    if (prioridadLevantador >= 0 && levantadoresActuales > 0) {
      return Math.max(4, 12 - prioridadLevantador * 2);
    }

    if (!tienePrincipalExcedido) {
      return 0; // Hay cupo libre para su posición principal
    }

    // Si su posición principal está llena, vemos si tiene alguna alternativa con cupo libre
    const tieneAlgunaAlternativaLibre = posicionesJugador.slice(1).some((posicion) => {
      const limiteAlt = FORMACION_VOLLEY[posicion] ?? 1;
      const ocupacionAlt = equipo.posiciones[posicion] ?? 0;
      return ocupacionAlt < limiteAlt;
    });

    if (tieneAlgunaAlternativaLibre) {
      return 2; // Penalización media
    }

    return 6; // Penalización alta (todo lleno)
  }

  private construirResultado(equipos: EquipoEnConstruccion[]): ResultadoOrganizacion {
    const equiposFinales = equipos.map<Equipo>((equipo) => {
      const jugadoresAsignados = this.asignarPosicionesDeJuego(equipo.jugadores);

      return {
        id: equipo.id,
        nombre: equipo.nombre,
        jugadores: jugadoresAsignados,
        puntajeTotal: equipo.puntajeTotal,
        puntajePromedio: this.redondear(equipo.puntajeTotal / equipo.jugadores.length),
        posiciones: this.contarPosicionesAsignadas(jugadoresAsignados),
      };
    });

    const puntajes = equiposFinales.map((equipo) => equipo.puntajeTotal);
    const promedios = equiposFinales.map((equipo) => equipo.puntajePromedio);

    return {
      equipos: equiposFinales,
      resumen: {
        puntajeMinimo: Math.min(...puntajes),
        puntajeMaximo: Math.max(...puntajes),
        diferenciaPuntaje: Math.max(...puntajes) - Math.min(...puntajes),
        promedioMinimo: Math.min(...promedios),
        promedioMaximo: Math.max(...promedios),
        diferenciaPromedio: this.redondear(Math.max(...promedios) - Math.min(...promedios)),
      },
    };
  }

  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private asignarPosicionesDeJuego(jugadores: Jugador[]): JugadorAsignado[] {
    const cupos = this.crearCuposFormacion(jugadores.length);
    const jugadoresPendientes = [...jugadores].sort((a, b) => {
      if (a.posiciones.length !== b.posiciones.length) {
        return a.posiciones.length - b.posiciones.length;
      }
      return b.puntaje - a.puntaje;
    });
    const asignados: JugadorAsignado[] = [];

    // PASO 1: Asignar posiciones principales preferidas
    // Si la posición principal del jugador tiene cupo disponible, se le asigna de inmediato.
    const listadoRestante: Jugador[] = [];
    for (const jugador of jugadoresPendientes) {
      const principal = this.obtenerPosicionPrincipal(jugador);
      if (cupos[principal] > 0) {
        asignados.push({
          ...jugador,
          posicionAsignada: principal,
        });
        cupos[principal] -= 1;
      } else {
        listadoRestante.push(jugador);
      }
    }
    jugadoresPendientes.length = 0;
    jugadoresPendientes.push(...listadoRestante);

    // PASO 2: Asignar posiciones secundarias/alternativas restantes
    for (const posicion of PRIORIDAD_POSICIONES) {
      while (cupos[posicion] > 0 && jugadoresPendientes.length > 0) {
        const indiceJugador = this.buscarMejorJugadorParaPosicion(jugadoresPendientes, posicion);
        const [jugador] = jugadoresPendientes.splice(indiceJugador, 1);

        asignados.push({
          ...jugador,
          posicionAsignada: posicion,
        });
        cupos[posicion] -= 1;
      }
    }

    // PASO 3: Asignar jugadores restantes como suplentes
    while (jugadoresPendientes.length > 0) {
      const jugador = jugadoresPendientes.shift()!;
      asignados.push({
        ...jugador,
        posicionAsignada: 'suplente',
      });
    }

    return asignados.sort((a, b) => b.puntaje - a.puntaje);
  }

  private crearCuposFormacion(cantidadJugadores: number): Record<Posicion, number> {
    if (cantidadJugadores >= 6) {
      return { ...FORMACION_VOLLEY };
    }

    const combinaciones = this.generarCombinacionesCupos(cantidadJugadores);

    return combinaciones.sort((a, b) => this.puntuarCuposFormacion(b) - this.puntuarCuposFormacion(a))[0];
  }

  private generarCombinacionesCupos(cantidadJugadores: number): Record<Posicion, number>[] {
    const combinaciones: Record<Posicion, number>[] = [];

    for (let levantador = 0; levantador <= FORMACION_VOLLEY.levantador; levantador += 1) {
      for (let opuesto = 0; opuesto <= FORMACION_VOLLEY.opuesto; opuesto += 1) {
        for (let central = 0; central <= FORMACION_VOLLEY.central; central += 1) {
          for (let punta = 0; punta <= FORMACION_VOLLEY.punta; punta += 1) {
            if (levantador + opuesto + central + punta === cantidadJugadores) {
              combinaciones.push({ levantador, opuesto, central, punta, suplente: 0 });
            }
          }
        }
      }
    }

    return combinaciones;
  }

  private puntuarCuposFormacion(cupos: Record<Posicion, number>): number {
    const tieneLevantador = cupos.levantador > 0 ? 1 : 0;
    const tieneCentral = cupos.central > 0 ? 1 : 0;
    const tienePunta = cupos.punta > 0 ? 1 : 0;
    const tieneOpuesto = cupos.opuesto > 0 ? 1 : 0;
    const puestosCubiertos = tieneLevantador + tieneCentral + tienePunta + tieneOpuesto;
    const equilibrioCentralPunta = 2 - Math.abs(cupos.central - cupos.punta);

    return (
      tieneLevantador * 10 +
      tieneCentral * 5 +
      tienePunta * 5 +
      tieneOpuesto * 1 +
      puestosCubiertos * 2 +
      equilibrioCentralPunta * 2 +
      cupos.central +
      cupos.punta
    );
  }

  private buscarMejorJugadorParaPosicion(jugadores: Jugador[], posicion: Posicion): number {
    const candidatos = jugadores
      .map((jugador, index) => ({
        index,
        afinidad: this.calcularAfinidadPosicion(jugador, posicion),
      }))
      .sort((a, b) => {
        if (b.afinidad !== a.afinidad) {
          return b.afinidad - a.afinidad;
        }

        if (jugadores[a.index].posiciones.length !== jugadores[b.index].posiciones.length) {
          return jugadores[a.index].posiciones.length - jugadores[b.index].posiciones.length;
        }

        return jugadores[b.index].puntaje - jugadores[a.index].puntaje;
      });

    return candidatos[0].index;
  }

  private calcularAfinidadPosicion(jugador: Jugador, posicion: Posicion): number {
    const prioridad = this.obtenerPosiciones(jugador).indexOf(posicion);

    if (prioridad >= 0) {
      return Math.max(1, 4 - prioridad);
    }

    return posicion === 'levantador' ? -2 : 0;
  }

  private obtenerPosiciones(jugador: Jugador): Posicion[] {
    return jugador.posiciones as Posicion[];
  }

  private obtenerPosicionPrincipal(jugador: Jugador): Posicion {
    return this.obtenerPosiciones(jugador)[0];
  }

  private contarPosicionesAsignadas(jugadores: JugadorAsignado[]): Record<Posicion, number> {
    const posiciones = this.crearContadorPosiciones();

    for (const jugador of jugadores) {
      posiciones[jugador.posicionAsignada] += 1;
    }

    return posiciones;
  }
}

export const JUGADORES_EJEMPLO: Jugador[] = [
  { id: 1, nombre: 'Andres Camacho', puntaje: 4, posiciones: ['central', 'punta'] },
  { id: 2, nombre: 'Andres Panda', puntaje: 4, posiciones: ['central', 'punta'] },
  { id: 3, nombre: 'Benja', puntaje: 5, posiciones: ['central', 'punta'] },
  { id: 4, nombre: 'Camilo', puntaje: 6, posiciones: ['punta', 'opuesto'] },
  { id: 5, nombre: 'Javi', puntaje: 2, posiciones: ['punta', 'opuesto'] },
  { id: 6, nombre: 'Jenny', puntaje: 4, posiciones: ['punta', 'opuesto'] },
  { id: 7, nombre: 'Max', puntaje: 7, posiciones: ['levantador', 'punta'] },
  { id: 8, nombre: 'Mauro', puntaje: 6, posiciones: ['central', 'punta'] },
  { id: 9, nombre: 'Natu', puntaje: 4, posiciones: ['punta', 'opuesto'] },
  { id: 10, nombre: 'Yari', puntaje: 4, posiciones: ['punta', 'levantador', 'opuesto'] },
  { id: 11, nombre: 'Rigo', puntaje: 4, posiciones: ['levantador', 'opuesto'] },
  { id: 12, nombre: 'Lucaz', puntaje: 5, posiciones: ['levantador', 'opuesto', 'punta','central'] },
  { id: 13, nombre: 'Rodolfo', puntaje: 6, posiciones: ['punta', 'central'] },
  { id: 14, nombre: 'David', puntaje: 4, posiciones: ['central', 'punta'] },
  { id: 15, nombre: 'Alaniz', puntaje: 4, posiciones: ['punta', 'opuesto'] },
  { id: 16, nombre: 'Cristian Alaniz', puntaje: 5, posiciones: ['levantador', 'opuesto', 'punta'] },
];
