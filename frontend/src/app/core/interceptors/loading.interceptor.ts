// T043: Loading state interceptor

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Increment loading counter
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Decrement loading counter when request completes
      loadingService.hide();
    })
  );
};
