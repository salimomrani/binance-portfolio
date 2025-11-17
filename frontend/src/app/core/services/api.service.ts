// T039: HTTP client wrapper service with interceptors

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiSuccess } from '../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Performs GET request
   */
  get<T>(endpoint: string, params?: HttpParams | { [param: string]: string | string[] }): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        map(response => this.handleResponse<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs POST request
   */
  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(
        map(response => this.handleResponse<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs PUT request
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(
        map(response => this.handleResponse<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs PATCH request
   */
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(
        map(response => this.handleResponse<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`)
      .pipe(
        map(response => this.handleResponse<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Handles successful API response
   */
  private handleResponse<T>(response: ApiResponse<T>): T {
    if (response.success) {
      return (response as ApiSuccess<T>).data;
    }
    throw new Error(response.error.message);
  }

  /**
   * Handles API errors
   */
  private handleError(error: unknown): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
