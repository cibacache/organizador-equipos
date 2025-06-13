import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormadorDeEquiposComponent } from './formador-de-equipos/formador-de-equipos.component';

const routes: Routes = [
  { path: '', redirectTo: '/formador-de-equipos', pathMatch: 'full' },
  { path: 'formador-de-equipos', component: FormadorDeEquiposComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }