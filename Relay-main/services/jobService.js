const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');
const reconcileService = require('./reconcileService');

const JOB_TYPES = {
  RECONCILE: 'RECONCILE',
};

const jobs = new Map();
const queue = [];
let isProcessing = false;

const createJob = (type, payload) => {
  const id = crypto.randomUUID();
  const now = new Date();
  const job = {
    id,
    type,
    payload,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    finishedAt: null,
    result: null,
    error: null,
  };

  jobs.set(id, job);
  queue.push(id);
  processQueue().catch((err) => logger.error('Job processor failed', { error: err.message, stack: err.stack }));
  return job;
};

const getJob = (jobId) => jobs.get(jobId) || null;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const jobId = queue.shift();
    const job = jobs.get(jobId);
    if (!job) continue;

    job.status = 'running';
    job.startedAt = new Date();
    job.updatedAt = new Date();

    try {
      if (job.type === JOB_TYPES.RECONCILE) {
        job.result = await reconcileService.reconcileUser(job.payload.userId);
      } else {
        throw new Error(`Unsupported job type: ${job.type}`);
      }
      job.status = 'completed';
      job.finishedAt = new Date();
      job.updatedAt = job.finishedAt;
    } catch (err) {
      job.status = 'failed';
      job.error = { message: err.message, stack: err.stack };
      job.finishedAt = new Date();
      job.updatedAt = job.finishedAt;
      logger.error('Job execution failed', { jobId: job.id, error: err.message, stack: err.stack });
    }
  }

  isProcessing = false;
};

const enqueueReconcile = (userId) => createJob(JOB_TYPES.RECONCILE, { userId });

const waitForJobResult = async (jobId, timeoutMs = 3000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = getJob(jobId);
    if (!job) {
      const err = new Error('Job not found');
      err.status = 404;
      throw err;
    }
    if (job.status === 'completed' || job.status === 'failed') return job;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return getJob(jobId);
};

const scheduleAutoReconcile = () => {
  const minutes = parseInt(process.env.RECONCILE_AUTO_INTERVAL_MIN, 10);
  if (!minutes || minutes <= 0) return;

  const interval = minutes * 60 * 1000;
  setInterval(async () => {
    try {
      const users = await User.find({ active: true }).select('_id').lean();
      users.forEach((user) => enqueueReconcile(user._id));
      logger.info('Auto-scheduled reconcile jobs enqueued', { count: users.length });
    } catch (err) {
      logger.error('Auto reconcile schedule failure', { error: err.message, stack: err.stack });
    }
  }, interval).unref?.();
};

const start = () => {
  processQueue().catch((err) => logger.error('Job processor failed', { error: err.message, stack: err.stack }));
  scheduleAutoReconcile();
};

module.exports = {
  enqueueReconcile,
  getJob,
  waitForJobResult,
  start,
};
