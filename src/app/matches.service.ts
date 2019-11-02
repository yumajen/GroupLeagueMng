import { Injectable } from '@angular/core';
import { MatchInformation } from './matchInformation';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MatchesService {

  private matchesUrl = 'api/matches'; // Web APIのURL
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient
  ) { }

  getMatcheInformations(): Observable<MatchInformation[]> {
    return this.http.get<MatchInformation[]>(this.matchesUrl)
      .pipe(
        catchError(this.handleError<MatchInformation[]>('getMatchInformations', []))
      );
  }

  registMatcheInformation(inputMatchInfo: MatchInformation): Observable<MatchInformation> {
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
}
