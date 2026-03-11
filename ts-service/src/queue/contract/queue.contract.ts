import { EnqueuedJob } from "../queue.service";

export interface IQueue {
    enqueue<TPayload>(name: string, payload: TPayload): EnqueuedJob<TPayload>;
    getQueuedJobs(): readonly EnqueuedJob[];
}