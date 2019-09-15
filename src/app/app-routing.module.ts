import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistPlayersComponent } from './regist-players/regist-players.component';
import { LeagueComponent } from './league/league.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(
    [
      { path: '', redirectTo: '/register-players', pathMatch: 'full' },
      { path: 'register-players', component: RegistPlayersComponent },
      { path: 'league', component: LeagueComponent }
    ]
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
