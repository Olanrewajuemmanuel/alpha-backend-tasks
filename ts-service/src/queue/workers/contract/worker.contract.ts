export interface IWorker {
  poll(): Promise<void>;
  run(job: any): Promise<void>;
}
