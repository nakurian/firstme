import { Queue } from "bullmq";
import { getBullMQConnection } from "./connection";

export interface JiraJobData {
  taskId: string;
  repoIdentifier: string;
  taskDescription: string;
  projectKey: string;
  issueType: string;
  instructions?: string;
}

let _queue: Queue | null = null;

export function getJiraQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("jira", {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 1,
      },
    });
  }
  return _queue;
}

export async function addJiraJob(data: JiraJobData) {
  const queue = getJiraQueue();
  return queue.add("jira-ticket", data, {
    jobId: data.taskId,
  });
}
