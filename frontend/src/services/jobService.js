/**
 * Job Service
 * Handles background job management and polling for async operations
 * This is a frontend client that manages communication with backend background jobs
 */

import * as API from '../api/index.js';

class JobService {
  constructor() {
    this.jobs = new Map(); // Store job tracking data in memory
    this.pollingIntervals = new Map(); // Store polling interval IDs
    this.maxPollingDuration = 30 * 60 * 1000; // 30 minutes max polling
    this._loadState(); // Restore jobs after page refresh
  }

  /**
   * Persist active jobs to session storage so they survive page reloads
   */
  _saveState() {
    try {
      // Remove non-serializable callbacks before saving
      const serializableJobs = Array.from(this.jobs.entries()).map(([id, job]) => [
        id,
        { ...job, callbacks: undefined }
      ]);
      sessionStorage.setItem('relay_active_jobs', JSON.stringify(serializableJobs));
    } catch (e) {
      console.warn('[JobService] Failed to save state to sessionStorage', e);
    }
  }

  /**
   * Load jobs from previous session and automatically resume polling
   */
  _loadState() {
    try {
      const saved = sessionStorage.getItem('relay_active_jobs');
      if (saved) {
        const parsedJobs = JSON.parse(saved);
        parsedJobs.forEach(([id, job]) => {
          job.callbacks = { onProgress: null, onComplete: null, onError: null };
          this.jobs.set(id, job);
        });
      }
    } catch (e) {
      console.warn('[JobService] Failed to load state from sessionStorage', e);
    }
  }

  /**
   * Start a reconciliation job and begin polling for status
   */
  async startReconciliationJob() {
    try {
      // Call the reconcile endpoint which returns jobId (if async) or direct results
      const response = await API.reconcile();

      if (response.jobId) {
        // Async mode - job enqueued, start polling
        const job = {
          id: response.jobId,
          type: 'reconciliation',
          status: 'pending',
          startTime: Date.now(),
          result: null,
          error: null,
          progress: 0,
          callbacks: {
            onProgress: null,
            onComplete: null,
            onError: null
          }
        };

        this.jobs.set(response.jobId, job);
        this._saveState();
        console.log('[JobService] Started reconciliation job:', response.jobId);

        return {
          jobId: response.jobId,
          status: 'pending',
          message: 'Reconciliation job started'
        };
      } else {
        // Sync mode - results returned immediately
        return {
          jobId: null,
          status: 'completed',
          data: response.data || response,
          message: 'Reconciliation completed'
        };
      }
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get job status and begin polling if not already polling
   */
  async getJobStatus(jobId, onProgress, onComplete, onError) {
    try {
      if (!jobId) throw new Error('Job ID is required');
      if (!this.jobs.has(jobId)) {
        throw new Error(`Job ${jobId} not found locally`);
      }

      const job = this.jobs.get(jobId);

      // Set callbacks
      if (onProgress) job.callbacks.onProgress = onProgress;
      if (onComplete) job.callbacks.onComplete = onComplete;
      if (onError) job.callbacks.onError = onError;

      // Start polling if not already polling
      if (!this.pollingIntervals.has(jobId)) {
        this.startPolling(jobId);
      }

      return job;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Cancel polling for a job
   */
  cancelPolling(jobId) {
    try {
      if (this.pollingIntervals.has(jobId)) {
        clearInterval(this.pollingIntervals.get(jobId));
        this.pollingIntervals.delete(jobId);
        console.log('[JobService] Stopped polling for job:', jobId);
      }
    } catch (error) {
      console.error('[JobService] Error canceling polling:', error);
    }
  }

  /**
   * Start polling for job status
   * This is an internal method called by getJobStatus
   */
  startPolling(jobId) {
    const job = this.jobs.get(jobId);
    const pollInterval = 2000; // Poll every 2 seconds

    const interval = setInterval(async () => {
      try {
        // Call backend to get status
        const statusResponse = await this.fetchJobStatus(jobId);

        job.status = statusResponse.status;
        job.progress = statusResponse.progress || 0;

        // Call progress callback
        if (job.callbacks.onProgress) {
          job.callbacks.onProgress({
            jobId,
            status: job.status,
            progress: job.progress,
            ...statusResponse
          });
        }

        // Check if job is complete
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          clearInterval(interval);
          this.pollingIntervals.delete(jobId);
          this._saveState(); // Update storage once finished

          if (job.status === 'completed') {
            job.result = statusResponse.data;
            if (job.callbacks.onComplete) {
              job.callbacks.onComplete({
                jobId,
                status: job.status,
                data: job.result,
                ...statusResponse
              });
            }
          } else if (job.status === 'failed') {
            job.error = statusResponse.error || 'Job failed';
            if (job.callbacks.onError) {
              job.callbacks.onError({
                jobId,
                status: job.status,
                error: job.error,
                ...statusResponse
              });
            }
          }
        }

        // Check if polling should timeout
        const elapsedTime = Date.now() - job.startTime;
        if (elapsedTime > this.maxPollingDuration) {
          clearInterval(interval);
          this.pollingIntervals.delete(jobId);
          job.error = 'Polling timeout exceeded';
          if (job.callbacks.onError) {
            job.callbacks.onError({
              jobId,
              status: 'timeout',
              error: job.error
            });
          }
        }
      } catch (error) {
        console.error('[JobService] Polling error for job', jobId, ':', error);
        job.error = error.message;
        if (job.callbacks.onError) {
          job.callbacks.onError({
            jobId,
            status: 'error',
            error: error.message
          });
        }
      }
    }, pollInterval);

    this.pollingIntervals.set(jobId, interval);
    console.log('[JobService] Started polling for job:', jobId);
  }

  /**
   * Fetch job status from backend
   * This method calls the backend API to get the current status
   */
  async fetchJobStatus(jobId) {
    try {
      // This assumes the backend has implemented GET /transactions/reconcile/status/:jobId
      // or a similar endpoint for other job types
      return await API.req('GET', `/transactions/reconcile/status/${jobId}`);
    } catch (error) {
      throw new Error(`Failed to fetch job status: ${error.message}`);
    }
  }

  /**
   * Get locally stored job by ID
   */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all tracked jobs
   */
  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  /**
   * Clear a completed job from tracking
   */
  clearJob(jobId) {
    this.cancelPolling(jobId);
    this.jobs.delete(jobId);
    this._saveState();
  }

  /**
   * Clear all completed jobs
   */
  clearCompletedJobs() {
    const completedJobs = Array.from(this.jobs.entries())
      .filter(([_, job]) => ['completed', 'failed', 'cancelled'].includes(job.status))
      .map(([jobId]) => jobId);

    completedJobs.forEach(jobId => this.clearJob(jobId));
    this._saveState();
    return completedJobs.length;
  }

  /**
   * Format and log errors consistently
   */
  formatError(error) {
    console.error('[JobService] Error:', error);
    return {
      message: error.message || 'An error occurred',
      status: error.status,
      errors: error.errors
    };
  }
}

export default new JobService();
