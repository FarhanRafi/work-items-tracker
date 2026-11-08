export enum WorkItemStatus {
  Todo = 1,
  InProgress = 2,
  InReview = 3,
  Done = 4,
  Blocked = 5
}

export enum WorkItemPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export interface WorkItem {
  id: string;
  title: string;
  description: string | null;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  dueDateUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  ownerId: string;
}

export interface CreateWorkItemRequest {
  title: string;
  description?: string | null;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  dueDateUtc?: string | null;
}

export interface UpdateWorkItemRequest {
  title: string;
  description?: string | null;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  dueDateUtc?: string | null;
}

export interface WorkItemFilter {
  status?: WorkItemStatus | null;
  priority?: WorkItemPriority | null;
  search?: string | null;
}

export const WORK_ITEM_STATUS_LABELS: Record<WorkItemStatus, string> = {
  [WorkItemStatus.Todo]: 'To Do',
  [WorkItemStatus.InProgress]: 'In Progress',
  [WorkItemStatus.InReview]: 'In Review',
  [WorkItemStatus.Done]: 'Done',
  [WorkItemStatus.Blocked]: 'Blocked'
};

export const WORK_ITEM_PRIORITY_LABELS: Record<WorkItemPriority, string> = {
  [WorkItemPriority.Low]: 'Low',
  [WorkItemPriority.Medium]: 'Medium',
  [WorkItemPriority.High]: 'High',
  [WorkItemPriority.Critical]: 'Critical'
};

