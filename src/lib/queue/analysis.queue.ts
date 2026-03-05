import { Queue } from "bullmq";
import { getBullMQConnection } from "./connection";

export interface AnalysisJobData {
  analysisId: string;
  repoIdentifier: string;
  errorLogs: string;
  description?: string;
  instructions?: string;
  allowWriteTools?: boolean;
}

let _queue: Queue | null = null;

export function getAnalysisQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("analysis", {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 1, // Don't retry claude -p automatically
      },
    });
  }
  return _queue;
}

export async function addAnalysisJob(data: AnalysisJobData) {
  const queue = getAnalysisQueue();
  return queue.add("analyze", data, {
    jobId: data.analysisId,
  });
}
