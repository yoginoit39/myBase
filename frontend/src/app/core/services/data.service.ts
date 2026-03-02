import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  private headers(apiKey: string): HttpHeaders {
    return new HttpHeaders({ 'x-api-key': apiKey });
  }

  getRows(apiKey: string, tableName: string, params: Record<string, string> = {}): Observable<any[]> {
    const query = new URLSearchParams(params).toString();
    const url = `${environment.apiUrl}/data/${tableName}${query ? '?' + query : ''}`;
    return this.http.get<any[]>(url, { headers: this.headers(apiKey) });
  }

  insertRow(apiKey: string, tableName: string, data: Record<string, any>): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/data/${tableName}`, data, { headers: this.headers(apiKey) });
  }

  updateRow(apiKey: string, tableName: string, id: number, data: Record<string, any>): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/data/${tableName}/${id}`, data, { headers: this.headers(apiKey) });
  }

  deleteRow(apiKey: string, tableName: string, id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/data/${tableName}/${id}`, { headers: this.headers(apiKey) });
  }
}
