export interface Jugador {
  id: number;
  nombre: string;
  puntaje: number;
  isPresent: boolean;
}

export interface Equipo {
  jugadores: Jugador[];
  puntaje: number;
}
