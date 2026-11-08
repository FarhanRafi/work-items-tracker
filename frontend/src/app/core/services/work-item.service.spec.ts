import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkItemService } from './work-item.service';
import {
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  WorkItem,
  WorkItemPriority,
  WorkItemStatus
} from '../models/work-item.model';

describe('WorkItemService', () => {
  let service: WorkItemService;
  let httpTesting: HttpTestingController;

  const mockItem: WorkItem = {
    id: 'item-1',
    title: 'Test Work Item',
    description: 'Detailed description',
    status: WorkItemStatus.Todo,
    priority: WorkItemPriority.Medium,
    dueDateUtc: '2026-12-01T00:00:00Z',
    createdAtUtc: '2026-11-08T00:00:00Z',
    updatedAtUtc: null,
    ownerId: 'user-1'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkItemService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(WorkItemService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all work items without filter', () => {
    service.getAll().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('item-1');
    });

    const req = httpTesting.expectOne('/api/workitems');
    expect(req.request.method).toBe('GET');
    req.flush([mockItem]);
  });

  it('should apply filters to query params in getAll', () => {
    service.getAll({ status: WorkItemStatus.InProgress, priority: WorkItemPriority.High, search: 'auth' })
      .subscribe((items) => {
        expect(items).toEqual([mockItem]);
      });

    const req = httpTesting.expectOne((r) =>
      r.url === '/api/workitems' &&
      r.params.get('status') === '2' &&
      r.params.get('priority') === '3' &&
      r.params.get('search') === 'auth'
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockItem]);
  });

  it('should get work item by id', () => {
    service.getById('item-1').subscribe((item) => {
      expect(item.title).toBe('Test Work Item');
    });

    const req = httpTesting.expectOne('/api/workitems/item-1');
    expect(req.request.method).toBe('GET');
    req.flush(mockItem);
  });

  it('should create a work item', () => {
    const createReq: CreateWorkItemRequest = {
      title: 'New Item',
      description: 'Desc',
      status: WorkItemStatus.Todo,
      priority: WorkItemPriority.Low,
      dueDateUtc: null
    };

    service.create(createReq).subscribe((item) => {
      expect(item.id).toBe('item-1');
    });

    const req = httpTesting.expectOne('/api/workitems');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(mockItem);
  });

  it('should update a work item', () => {
    const updateReq: UpdateWorkItemRequest = {
      title: 'Updated Title',
      description: 'Updated Desc',
      status: WorkItemStatus.Done,
      priority: WorkItemPriority.Critical,
      dueDateUtc: null
    };

    service.update('item-1', updateReq).subscribe((item) => {
      expect(item.status).toBe(WorkItemStatus.Done);
    });

    const req = httpTesting.expectOne('/api/workitems/item-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush({ ...mockItem, status: WorkItemStatus.Done });
  });

  it('should delete a work item', () => {
    service.delete('item-1').subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpTesting.expectOne('/api/workitems/item-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

