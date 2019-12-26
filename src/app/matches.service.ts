import { Injectable } from '@angular/core';
import { MatchInformation } from './matchInformation';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MatchesService {

  private matchesUrl = 'api/matches'; // Web APIのURL
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  registerParams: any[] = []; // 各グループ毎の対戦情報初期登録用パラメータ
  updateParams: any[] = []; // 各グループ毎のmatch-listから追加される対戦情報更新用パラメータ

  constructor(
    private http: HttpClient
  ) { }

  getMatcheInformations(): Observable<MatchInformation[]> {
    return this.http.get<MatchInformation[]>(this.matchesUrl)
      .pipe(
        catchError(this.handleError<MatchInformation[]>('getMatchInformations', []))
      );
  }

  registerMatcheInformation(inputMatchInfo: MatchInformation): Observable<MatchInformation> {
    return this.http.post<MatchInformation>(this.matchesUrl, inputMatchInfo, this.httpOptions)
      .pipe(
        catchError(this.handleError<MatchInformation>('registMatchInformations'))
      );
  }

  updateMatchInformation(updateMatchInfo: MatchInformation): Observable<MatchInformation> {
    return this.http.put<MatchInformation>(this.matchesUrl, updateMatchInfo, this.httpOptions)
      .pipe(
        catchError(this.handleError<MatchInformation>('updateMatchInformations'))
      )
  }

  handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }

  setRegisterParams(inputInformations): void {
    let currentIndex = this.registerParams.length;
    inputInformations.forEach((info) => {
      info['id'] = currentIndex;
      currentIndex++;
    });

    this.registerParams.push(...inputInformations);
  }

  setUpdateParams(matcheResults: any[]): void {
    // 既に同じID,groupIdの対戦情報がmatcheResultsに含まれていたら削除する
    matcheResults.forEach((result) => {
      this.updateParams.some((param, i) => {
        if (result.id == param.id && result.groupId == param.groupId) {
          this.updateParams.splice(i, 1);
          return;
        }
      });
    });
    this.updateParams.push(...matcheResults);
  }

  executeRegisterMatches(): Observable<MatchInformation>[] {
    let observables = this.registerParams.map((param) => {
      return this.registerMatcheInformation(param as MatchInformation);
    });

    return observables;
  }

  executeUpdateMatches(): Observable<MatchInformation>[] {
    let observables = this.updateParams.map((param) => {
      return this.updateMatchInformation(param as MatchInformation);
    });
    this.updateParams = [];

    return observables;
  }
}
