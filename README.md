# OrganizadorEquiposService

Servicio TypeScript para Angular que organiza jugadores de Volleyball en equipos balanceados por:

- Cantidad de jugadores por equipo.
- Puntaje total del equipo.
- Promedio de puntaje por jugador.
- Distribucion de posiciones principales.
- Posicion recomendada para cada jugador en cancha.
- Separacion de jugadores de menor nivel cuando sea posible.
- Separacion de levantadores cuando sea posible.

## Uso en Angular

Guarda `organizador-equipos.service.ts` en:

```text
src/app/services/organizador-equipos.service.ts
```

Ejemplo desde un componente:

```ts
import { Component } from '@angular/core';
import {
  JUGADORES_EJEMPLO,
  OrganizadorEquiposService,
  ResultadoOrganizacion,
} from './services/organizador-equipos.service';

@Component({
  selector: 'app-equipos',
  templateUrl: './equipos.component.html',
})
export class EquiposComponent {
  resultado?: ResultadoOrganizacion;

  constructor(private organizadorEquipos: OrganizadorEquiposService) {}

  crearEquipos(): void {
    this.resultado = this.organizadorEquipos.organizarDesdeSolicitud({
      numeroJugadores: JUGADORES_EJEMPLO.length,
      numeroEquipos: 3,
      jugadores: JUGADORES_EJEMPLO,
    });
  }
}
```

Tambien puedes usar el metodo directo:

```ts
const resultado = this.organizadorEquipos.organizarEquipos(jugadores, 3);
```

Cada jugador del resultado incluye `posicionAsignada`:

```ts
for (const equipo of resultado.equipos) {
  console.log(equipo.nombre);

  for (const jugador of equipo.jugadores) {
    console.log(`${jugador.nombre}: ${jugador.posicionAsignada}`);
  }
}
```

## Criterio del algoritmo

El algoritmo ordena primero a los jugadores mas fuertes y a los jugadores con posiciones mas escasas. Luego evalua en que equipo conviene colocar a cada jugador usando un costo ponderado:

```text
costo =
  diferencia de puntaje total proyectada * 2
  + diferencia de promedio proyectada * 3
  + penalizacion por juntar jugadores de nivel bajo
  + penalizacion por repetir posiciones
```

El equipo con menor costo recibe al jugador, siempre respetando los cupos maximos. Para 16 jugadores y 3 equipos, los cupos quedan `6/5/5`, nunca `6/6/4`.

Despues de armar cada equipo, el servicio asigna posiciones de juego intentando completar esta formacion:

```text
1 levantador
1 opuesto
2 centrales
2 puntas
```

Si el equipo tiene menos de 6 jugadores, no se sigue una secuencia fija. El servicio calcula la combinacion de puestos mas equilibrada para la cantidad de jugadores disponible, priorizando tener levantador y una buena base de centrales/puntas. El opuesto se considera, pero pesa menos que las otras posiciones en equipos incompletos.
