// T040: Global error handling service

import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from './notification.service';

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private readonly notificationService = inject(NotificationService);

  /**
   * Handles and displays errors to the user
   */
  handleError(error: unknown): void {
    const appError = this.parseError(error);
    console.error('Application Error:', appError);
    this.notificationService.error(appError.message);
  }

  /**
   * Parses various error types into a consistent format
   */
  private parseError(error: unknown): AppError {
    if (error instanceof HttpErrorResponse) {
      return this.parseHttpError(error);
    }

    if (error instanceof Error) {
      return {
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date()
      };
    }

    return {
      message: 'An unknown error occurred',
      timestamp: new Date()
    };
  }

  /**
   * Parses HTTP errors into user-friendly messages
   */
  private parseHttpError(error: HttpErrorResponse): AppError {
    let message = 'An error occurred while communicating with the server';

    if (error.status === 0) {
      message = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      // Client errors
      message = error.error?.error?.message || 'Invalid request. Please check your input.';
    } else if (error.status >= 500) {
      // Server errors
      message = 'Server error. Please try again later.';
    }

    return {
      message,
      code: error.error?.error?.code || `HTTP_${error.status}`,
      details: error.error,
      timestamp: new Date()
    };
  }
}
