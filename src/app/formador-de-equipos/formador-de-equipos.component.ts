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
	equipos: Equipo[] = [];
	imputCapitanes: string = '';
	capitanes: number[] = [];
	contador: number = 0;
	equiposQueJuegan: Jugador[] = [];

	ngOnInit(): void {
		this.jugadoresBase = this.cargarJugadores();
	}

	cargarJugadores(): Jugador[] {
		const data = localStorage.getItem(this.STORAGE_KEY);
		if (data) {
			return JSON.parse(data);
		}

		// 1 Recien empieza a jugar
		// 2 Lleva un tiempo aprendiendo
		// 3 terminando de aprender lo básico
		// 4 sabe jugar 
		// 5 Sabe jugar y es alto
		// 6 sabe jugar Boquea, remacha, saca bien  
		// 7 Juega bien en todas las posiciones o tiene una muy desequilibrada

		// Si no hay datos en localStorage, retornar jugadores por defecto
		return [
			{ id: 1, nombre: "Andres Camacho", puntaje: 3, isPresent: true },
			{ id: 2, nombre: "Andres Panda", puntaje: 4, isPresent: true },
			{ id: 3, nombre: "Benja", puntaje: 5, isPresent: true },
			{ id: 4, nombre: "Camilo", puntaje: 6, isPresent: true },
			{ id: 5, nombre: "Carola", puntaje: 4, isPresent: true },
			{ id: 6, nombre: "Cepillin", puntaje: 4, isPresent: true },
			{ id: 7, nombre: "Cintya", puntaje: 4, isPresent: true },
			{ id: 9, nombre: "Javi", puntaje: 2, isPresent: true },
			{ id: 10, nombre: "Jenny", puntaje: 4, isPresent: true },
			{ id: 11, nombre: "Juan Carlos", puntaje: 4, isPresent: true },
			{ id: 12, nombre: "Leo", puntaje: 6, isPresent: true },
			{ id: 13, nombre: "Max", puntaje: 7, isPresent: true },
			{ id: 14, nombre: "Mauro", puntaje: 6, isPresent: true },
			{ id: 15, nombre: "Natu", puntaje: 4, isPresent: true },
			{ id: 16, nombre: "Pablo", puntaje: 4, isPresent: true },
			{ id: 17, nombre: "Patty", puntaje: 4, isPresent: true },
			{ id: 18, nombre: "Robinson", puntaje: 5, isPresent: true },
			{ id: 19, nombre: "Yari", puntaje: 4, isPresent: true },
			{ id: 20, nombre: "Jose", puntaje: 3, isPresent: true },
			{ id: 21, nombre: "Priscila", puntaje: 3, isPresent: true },
			{ id: 22, nombre: "Javivi", puntaje: 3, isPresent: true },
			{ id: 23, nombre: "Aldo", puntaje: 5, isPresent: true }
		];
	}

	guardarJugadores(): void {
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.jugadoresBase));
	}



	agregarJugador(nombre: string, puntaje: number): void {
		if (!nombre.trim()) {
			alert("Ingrese un nombre válido");
			return;
		}
		if (this.jugadoresBase.some(j => j.nombre === nombre)) {
			alert("Ese jugador ya está en la lista.");
			return;
		}

		this.jugadoresBase.push({ id: this.traerIdmasGrande(), nombre, puntaje, isPresent: true });
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

	jugadoresPresentes(): number {
		return this.jugadoresBase.filter(j => j.isPresent).length;
	}
	generarEquipos(): void {
		this.elegirEquiposQueJuegan();
		const numEquipos = this.numeroEquipos;
		this.capitanes = this.jugadoresBase.filter(j => this.capitanes.includes(j.id)).map(j => j.id);

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

		this.equipos = Array.from({ length: numEquipos }, () => ({
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
	agregarCapitan(id: number): void {
		if (this.capitanes.includes(id)) {
			alert("Ese jugador ya está en la lista de capitanes.");
			return;
		}
		if (this.capitanes.length >= this.numeroEquipos) {
			alert("El número de capitanes no puede ser mayor que el número de equipos.");
			return;
		}
		const jugador = this.jugadoresBase.find(j => j.id === id);
		if (!jugador) {
			alert("No existe un jugador con ese ID.");
			return;
		}
		this.capitanes.push(id);
	}

	eliminarCapitan(id: number): void {
		const index = this.capitanes.indexOf(id);
		if (index !== -1) {
			this.capitanes.splice(index, 1);
		} else {
			alert("El jugador no es un capitán.");
		}
	}

	getJugadorById(id: number): string | undefined {
		return this.jugadoresBase.find(j => j.id === id)?.nombre;
	}

	incrementarContador(): void {
		this.contador++;
	}

	borrarStorageKey(): void {
		localStorage.removeItem(this.STORAGE_KEY);
		alert('STORAGE_KEY eliminado del localStorage.');
	}

	elegirEquiposQueJuegan(){
		const capitanes = this.jugadoresBase.filter(j => this.capitanes.includes(j.id));
		if (capitanes.length > 2) {
			// Mezcla aleatoriamente los capitanes
			const mezclados = capitanes.sort(() => Math.random() - 0.5);
			this.equiposQueJuegan = mezclados;
		}
	}
}