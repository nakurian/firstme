import IORedis from "ioredis";
import { config } from "../config";

let _redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return _redis;
}

// BullMQ connection config (avoids ioredis version mismatch)
export function getBullMQConnection() {
  return { url: config.redisUrl };
}

// Separate connection for pub/sub (subscribers need dedicated connections)
export function createSubscriber(): IORedis {
  return new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
  });
}
