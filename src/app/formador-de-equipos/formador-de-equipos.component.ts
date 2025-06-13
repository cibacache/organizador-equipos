import { Component, OnInit } from '@angular/core';
import { Jugador, Equipo } from '../models/jugador.model';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-formador-de-equipos',
  imports: [CommonModule, FormsModule], 
  templateUrl: './formador-de-equipos.component.html',
  styleUrls: ['./formador-de-equipos.component.css']
})
export class FormadorDeEquiposComponent implements OnInit {
  STORAGE_KEY = 'jugadoresVoley';
  jugadoresBase: Jugador[] = [];
  numeroEquipos: number = 3;
  equipos: Equipo[]=[];
  imputCapitanes: string = '';
  capitanes: number[] = [];

  ngOnInit(): void {
    this.jugadoresBase = this.cargarJugadores();
  }

  cargarJugadores(): Jugador[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
        return JSON.parse(data);
    }
    // Si no hay datos en localStorage, retornar jugadores por defecto
    return [
        { id: 1, nombre: "Andres Externo", puntaje: 1, isPresent: true },
        { id: 2, nombre: "Andres ULS", puntaje: 2, isPresent: true },
        { id: 3, nombre: "Benja", puntaje: 2, isPresent: true },
        { id: 4, nombre: "Camilo", puntaje: 3, isPresent: true },
        { id: 5, nombre: "Carola", puntaje: 2, isPresent: true },
        { id: 6, nombre: "Cepillin", puntaje: 2, isPresent: true },
        { id: 7, nombre: "Cintya", puntaje: 2, isPresent: true },
        { id: 8, nombre: "Constanza", puntaje: 1, isPresent: true },
        { id: 9, nombre: "Javi", puntaje: 1, isPresent: true },
        { id: 10, nombre: "Jenny", puntaje: 2, isPresent: true },
        { id: 11, nombre: "Juan Carlos", puntaje: 2, isPresent: true },
        { id: 12, nombre: "Leo", puntaje: 3, isPresent: true },
        { id: 13, nombre: "Max", puntaje: 3, isPresent: true },
        { id: 14, nombre: "Mauro", puntaje: 3, isPresent: true },
        { id: 15, nombre: "Natu", puntaje: 2, isPresent: true },
        { id: 16, nombre: "Pablo", puntaje: 2, isPresent: true },
        { id: 17, nombre: "Patty", puntaje: 2, isPresent: true },
        { id: 18, nombre: "Robinson", puntaje: 2, isPresent: true },
        { id: 19, nombre: "Yari", puntaje: 2, isPresent: true }
    ];
  }

  guardarJugadores(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.jugadoresBase));
  }

 

  agregarJugador(nombre: string, puntaje:number ): void {
    if (!nombre.trim()) {
      alert("Ingrese un nombre válido");
      return;
    }
    if (this.jugadoresBase.some(j => j.nombre === nombre)) {
      alert("Ese jugador ya está en la lista.");
      return;
    }
     
    this.jugadoresBase.push({ id : this.traerIdmasGrande(), nombre,puntaje, isPresent: true });
    this.guardarJugadores();

  }

  traerIdmasGrande(): number {
    //deveuleve el id del jugador con la id más grande
    return this.jugadoresBase.reduce((max, j) => Math.max(max, j.id), 0) + 1;
  }
  actualizarPresencia(id: number, isPresent: boolean): void {
    const jugador = this.jugadoresBase.find(j => j.id === id);
    if (jugador) {
      jugador.isPresent = isPresent;
      this.guardarJugadores(); // Guarda los cambios en localStorage
    }
  }
  borrarJugador(nombre: string): void {
    this.jugadoresBase = this.jugadoresBase.filter(j => j.nombre.toLocaleLowerCase() !== nombre.toLocaleLowerCase());
    this.guardarJugadores();
  }

  distribuirTamaños(nJugadores: number, nEquipos: number): number[] {
    const base = Math.floor(nJugadores / nEquipos);
    const extras = nJugadores % nEquipos;
    return Array.from({ length: nEquipos }, (_, i) => base + (i < extras ? 1 : 0));
  }

  generarEquipos(): void {
    const numEquipos = this.numeroEquipos;
    this.capitanes = this.imputCapitanes
      .split(" ")
      .map(n => n.trim())
      .filter(n => n)
      .map(n => Number(n))
      .filter(n => !isNaN(n));

    //clona el array solo con los jugadores que están presentes
    const jugadoresPresentes = this.jugadoresBase.filter(j => j.isPresent).map(j => ({ ...j }));

    console.log("Jugadores presentes:", jugadoresPresentes);

    if (this.capitanes.length > numEquipos) {
      alert("Hay más capitanes que equipos.");
      return;
    }

    jugadoresPresentes.sort(() => Math.random() - 0.5);
    jugadoresPresentes.sort((a, b) => b.puntaje - a.puntaje);

    const tamaños = this.distribuirTamaños(jugadoresPresentes.length, numEquipos);

    this.equipos= Array.from({ length: numEquipos }, () => ({
        jugadores: [],
        puntaje: 0
    }));

    for (const jugador of jugadoresPresentes) {
      const candidatos = this.equipos.map((e, i) => ({ equipo: e, i }))
        .filter(({ equipo, i }) =>
          equipo.jugadores.length < tamaños[i] &&
        (!this.capitanes.includes(jugador.id) || !equipo.jugadores.some(j => this.capitanes.includes(j.id))));

      if (candidatos.length === 0) {
        alert(`No se pudo ubicar a ${jugador.nombre} respetando las restricciones.`);
        return;
      }

      const mejor = candidatos.reduce((a, b) => {
        const diffA = Math.abs((a.equipo.puntaje + jugador.puntaje) - this.mediaPuntajes(this.equipos, tamaños));
        const diffB = Math.abs((b.equipo.puntaje + jugador.puntaje) - this.mediaPuntajes(this.equipos, tamaños));
        return diffA < diffB ? a : b;
      });

      mejor.equipo.jugadores.push(jugador);
      mejor.equipo.puntaje += jugador.puntaje;
    }
    //mezcla el orden de los jugadores en cada equipo
    this.equipos.forEach(equipo => {
      equipo.jugadores.sort(() => Math.random() - 0.5);
    }
    );
    //mezcla el orden de los equipos
    this.equipos.sort(() => Math.random() - 0.5);
    console.log("Equipos generados:", this.equipos);
 
  }

  mediaPuntajes(equipos: any[], tamaños: number[]): number {
    const total = equipos.reduce((sum, e) => sum + e.puntaje, 0);
    const llenos = equipos.filter((e, i) => e.jugadores.length === tamaños[i]).length;
    return llenos ? total / llenos : total / equipos.length;
  }

}