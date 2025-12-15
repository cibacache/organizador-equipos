import { Routes } from '@angular/router';
import { FormadorDeEquiposComponent } from './formador-de-equipos/formador-de-equipos.component';
import { ResultadoPartidoComponent } from './resultado-partido/resultado-partido.component';

export const routes: Routes = [
  { path: '', component: FormadorDeEquiposComponent },
  { path: 'resultado', component: ResultadoPartidoComponent },
  { path: '**', redirectTo: '' }
];