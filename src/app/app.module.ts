import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegistPlayersComponent } from './regist-players/regist-players.component';
import { ShuffleComponent } from './shuffle/shuffle.component';
import { LeagueComponent } from './league/league.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule, MatDialogModule } from '@angular/material';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryPlayerDataService } from './in-memory-player-data.service';


@NgModule({
  declarations: [
    AppComponent,
    RegistPlayersComponent,
    ShuffleComponent,
    LeagueComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatDialogModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryPlayerDataService, { dataEncapsulation: false }
    )
  ],
  providers: [InMemoryPlayerDataService],
  bootstrap: [AppComponent],
  entryComponents: [ShuffleComponent]
})
export class AppModule { }
