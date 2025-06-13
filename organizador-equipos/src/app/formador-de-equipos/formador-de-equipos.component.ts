import { Component } from '@angular/core';

@Component({
  selector: 'app-formador-de-equipos',
  templateUrl: './formador-de-equipos.component.html',
  styleUrls: ['./formador-de-equipos.component.css']
})
export class FormadorDeEquiposComponent {
  STORAGE_KEY = 'jugadoresVoley';

  niveles = {
    "Alto": 3,
    "Medio": 2,
    "Bajo": 1
  };

  jugadoresBase = this.cargarJugadores();

  cargarJugadores() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) return JSON.parse(data);
    return [
      { nombre: "Jeny", nivel: "Medio", puntaje: 2 },
      { nombre: "Yari", nivel: "Medio", puntaje: 2 },
      { nombre: "Natu", nivel: "Medio", puntaje: 2 },
      { nombre: "Max", nivel: "Alto", puntaje: 3 },
      { nombre: "Camilo", nivel: "Alto", puntaje: 3 },
      { nombre: "Leo", nivel: "Alto", puntaje: 3 },
      { nombre: "Mauro", nivel: "Alto", puntaje: 3 },
      { nombre: "Venga", nivel: "Medio", puntaje: 2 },
      { nombre: "Javi", nivel: "Bajo", puntaje: 1 },
      { nombre: "Andres1", nivel: "Medio", puntaje: 2 },
      { nombre: "Andres2", nivel: "Bajo", puntaje: 1 },
      { nombre: "Constanza", nivel: "Bajo", puntaje: 1 },
      { nombre: "Juan-Carlos", nivel: "Medio", puntaje: 2 },
      { nombre: "Cepillin", nivel: "Medio", puntaje: 2 },
      { nombre: "Pablo", nivel: "Medio", puntaje: 2 }
    ];
  }

  agregarJugador(nombre: string, nivel: string) {
    if (!nombre) {
      alert("Ingrese un nombre válido");
      return;
    }
    if (this.jugadoresBase.some(j => j.nombre === nombre)) {
      alert("Ese jugador ya está en la lista.");
      return;
    }
    const puntaje = this.niveles[nivel];
    this.jugadoresBase.push({ nombre, nivel, puntaje });
    this.guardarJugadores();
  }

  borrarJugador(nombre: string) {
    this.jugadoresBase = this.jugadoresBase.filter(j => j.nombre !== nombre);
    this.guardarJugadores();
  }

  guardarJugadores() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.jugadoresBase));
  }

  // Additional methods for generating teams and rendering players can be added here
}