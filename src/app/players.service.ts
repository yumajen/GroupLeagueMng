import { Injectable } from '@angular/core';
import { Player } from './player';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class PlayersService {

  private playersUrl = 'api/players'; // Web APIのURL
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  isPlayersRegistered = false; // プレイヤーを登録済みかどうか判定
  otherItemLabels = []; // その他情報の項目名配列
  isExecuteAbstention = false; // 棄権処理を行ったかどうか判定
  abstainedPlayerIds: number[] = []; // 棄権プレイヤーのIDを保持する配列

  constructor(
    private http: HttpClient
  ) { }

  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.playersUrl)
      .pipe(
        catchError(this.handleError<Player[]>('getPlayers', []))
      );
  }

  registerPlayer(inputPlayer: Player): Observable<Player> {
    return this.http.post<Player>(this.playersUrl, inputPlayer, this.httpOptions)
      .pipe(
        catchError(this.handleError<Player>('registPlayer'))
      );
  }

  updatePlayer(updatePlayerInfo: Player): Observable<Player> {
    return this.http.put<Player>(this.playersUrl, updatePlayerInfo, this.httpOptions)
      .pipe(
        catchError(this.handleError<Player>('updatePlayer'))
      )
  }

  handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }

  executeRegisterPlayers(registerParams: any): Observable<Player>[] {
    let observables = registerParams.map((param) => {
      return this.registerPlayer(param as Player);
    });

    return observables;
  }

  executeUpdatePlayers(updateParams: any): Observable<Player>[] {
    let observables = updateParams.map((param) => {
      return this.updatePlayer(param as Player);
    });

    return observables;
  }

  storeOtherItemLabels(otherItemLabels: any[]): void {
    this.otherItemLabels = otherItemLabels;
  }

  setAbstainedPlayerIds(playerId: number): void {
    if (this.abstainedPlayerIds.indexOf(playerId) == -1) {
      this.abstainedPlayerIds.push(playerId);
    }
  }

  clearAbstainedPlayerIds(): void {
    this.abstainedPlayerIds = [];
  }

}
