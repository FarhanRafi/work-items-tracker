import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  WorkItem,
  WorkItemFilter
} from '../models/work-item.model';

@Injectable({
  providedIn: 'root'
})
export class WorkItemService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/workitems`;

  getAll(filter?: WorkItemFilter): Observable<WorkItem[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status != null) {
        params = params.set('status', filter.status.toString());
      }
      if (filter.priority != null) {
        params = params.set('priority', filter.priority.toString());
      }
      if (filter.search && filter.search.trim().length > 0) {
        params = params.set('search', filter.search.trim());
      }
    }

    return this.http.get<WorkItem[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<WorkItem> {
    return this.http.get<WorkItem>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateWorkItemRequest): Observable<WorkItem> {
    return this.http.post<WorkItem>(this.apiUrl, request);
  }

  update(id: string, request: UpdateWorkItemRequest): Observable<WorkItem> {
    return this.http.put<WorkItem>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

