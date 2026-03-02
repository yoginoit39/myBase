import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectTable, TableListItem, TableColumn } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class TableService {
  constructor(private http: HttpClient) {}

  list(projectId: string): Observable<TableListItem[]> {
    return this.http.get<TableListItem[]>(`${environment.apiUrl}/projects/${projectId}/tables`);
  }

  get(projectId: string, tableName: string): Observable<ProjectTable> {
    return this.http.get<ProjectTable>(`${environment.apiUrl}/projects/${projectId}/tables/${tableName}`);
  }

  create(projectId: string, name: string, columns: TableColumn[]): Observable<ProjectTable> {
    return this.http.post<ProjectTable>(`${environment.apiUrl}/projects/${projectId}/tables`, { name, columns });
  }

  delete(projectId: string, tableName: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/projects/${projectId}/tables/${tableName}`);
  }
}
