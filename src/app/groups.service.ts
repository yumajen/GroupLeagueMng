import { Injectable } from '@angular/core';
import { Group } from './group';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  private groupsUrl = 'api/groups'; // Web APIのURL
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient
  ) { }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.groupsUrl)
      .pipe(
        catchError(this.handleError<Group[]>('getGroups', []))
      );
  }

  registGroup(groupLeague: Group): Observable<Group> {
    return this.http.post<Group>(this.groupsUrl, groupLeague, this.httpOptions)
      .pipe(
        catchError(this.handleError<Group>('registGroup'))
      );
  }

  handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }

}
