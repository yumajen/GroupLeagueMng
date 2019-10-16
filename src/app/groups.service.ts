import { Injectable } from '@angular/core';
import { Group } from './group';
import { Linkage } from './linkage';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  private groupsUrl = 'api/groups'; // Web APIのURL
  private linkagesUrl = 'api/linkages'; // Web APIのURL
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

  getLinkages(): Observable<Linkage[]> {
    return this.http.get<Linkage[]>(this.linkagesUrl)
      .pipe(
        catchError(this.handleError<Linkage[]>('getLinkages', []))
      );
  }

  registGroup(groupLeague: Group): Observable<Group> {
    return this.http.post<Group>(this.groupsUrl, groupLeague, this.httpOptions)
      .pipe(
        catchError(this.handleError<Group>('registGroup'))
      );
  }

  registLinkage(linkage: Linkage): Observable<Linkage> {
    return this.http.post<Linkage>(this.linkagesUrl, linkage, this.httpOptions)
      .pipe(
        catchError(this.handleError<Linkage>('registLinkage'))
      );
  }

  handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }

}
