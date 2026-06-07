import { Routes } from '@angular/router';
import { FormadorDeEquiposComponent } from './formador-de-equipos/formador-de-equipos.component';
import { ResultadoPartidoComponent } from './resultado-partido/resultado-partido.component';
import { OrganizadorV2Component } from './organizador-v2/organizador-v2.component';

export const routes: Routes = [
  { path: '', component: FormadorDeEquiposComponent },
  { path: 'resultado', component: ResultadoPartidoComponent },
  { path: 'organizadorv2', component: OrganizadorV2Component },
  { path: '**', redirectTo: '' }
];