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
import { InMemoryDataService } from './in-memory-data.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatchListsComponent } from './match-lists/match-lists.component';

@NgModule({
  declarations: [
    AppComponent,
    RegistPlayersComponent,
    ShuffleComponent,
    LeagueComponent,
    MatchListsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService)
  ],
  providers: [InMemoryDataService],
  bootstrap: [AppComponent],
  entryComponents: [ShuffleComponent]
})
export class AppModule { }
