import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { IQueue } from './contract/queue.contract';

export interface EnqueuedJob<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  enqueuedAt: string;
}

@Injectable()
export class QueueService implements IQueue {
  private jobs: EnqueuedJob[] = [];

  enqueue<TPayload>(name: string, payload: TPayload): EnqueuedJob<TPayload> {
    const job: EnqueuedJob<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      enqueuedAt: new Date().toISOString(),
    };
    this.jobs.push(job);
    return job;
  }

  dequeue(index: string): boolean {
    const jobIndex = this.jobs.findIndex((job) => job.id === index);
    if (jobIndex === -1) {
      return false;
    }
    this.jobs.splice(jobIndex, 1);
    return true;
  }

  getQueuedJobs(): readonly EnqueuedJob[] {
    return this.jobs;
  }
}
