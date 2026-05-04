/**
 * Custom React Hooks for Services
 * Provides convenient hooks to use services in React components
 */

import { useState, useCallback, useEffect } from 'react';
import {
  transactionService,
  userService,
  ticketService,
  teamService,
  jobService
} from './index.js';

/**
 * Hook for managing transactions with loading and error states
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getTransactions(params);
      setTransactions(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { transactions, loading, error, fetchTransactions };
}

/**
 * Hook for managing user authentication
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await userService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.login(email, password);
      setUser(response.user || response);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await userService.logout();
  }, []);

  return {
    user,
    loading,
    error,
    fetchUser,
    login,
    logout,
    isAuthenticated: !!user
  };
}

/**
 * Hook for managing tickets
 */
export function useTickets() {
  const [tickets, setTickets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getTickets(params);
      setTickets(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const newTicket = await ticketService.createTicket(data);
      setTickets(prev => prev ? [newTicket, ...prev] : [newTicket]);
      return newTicket;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { tickets, loading, error, fetchTickets, createTicket };
}

/**
 * Hook for managing team members
 */
export function useTeam() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const members = await teamService.getTeamMembers();
      setTeam(members);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteMember = useCallback(async (email, role) => {
    setLoading(true);
    setError(null);
    try {
      const result = await teamService.inviteTeamMember(email, role);
      // Optionally refresh team list after invitation
      await fetchTeamMembers();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTeamMembers]);

  return {
    team,
    loading,
    error,
    fetchTeamMembers,
    inviteMember
  };
}

/**
 * Hook for managing background jobs (async operations)
 */
export function useJob(jobId = null) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    const handleProgress = (jobData) => {
      setJob(jobData);
    };

    const handleComplete = (jobData) => {
      setJob(jobData);
    };

    const handleError = (jobData) => {
      setError(jobData.error);
      setJob(jobData);
    };

    jobService.getJobStatus(jobId, handleProgress, handleComplete, handleError);

    return () => {
      jobService.cancelPolling(jobId);
    };
  }, [jobId]);

  const cancelJob = useCallback(() => {
    if (jobId) {
      jobService.cancelPolling(jobId);
      jobService.clearJob(jobId);
    }
  }, [jobId]);

  return { job, loading, error, cancelJob };
}

/**
 * Hook for managing reconciliation jobs
 */
export function useReconciliation() {
  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const startReconciliation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const response = await jobService.startReconciliationJob();
      
      if (response.jobId) {
        // Async job started
        setJobId(response.jobId);
        
        // Monitor the job
        jobService.getJobStatus(
          response.jobId,
          // onProgress
          (data) => {
            setProgress(data.progress || 0);
          },
          // onComplete
          (data) => {
            setResult(data);
            setLoading(false);
          },
          // onError
          (data) => {
            setError(data.error);
            setLoading(false);
          }
        );
      } else {
        // Sync job completed immediately
        setResult(response.data);
        setProgress(100);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Reconciliation failed');
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (jobId) {
      jobService.cancelPolling(jobId);
    }
  }, [jobId]);

  return {
    jobId,
    loading,
    error,
    result,
    progress,
    startReconciliation,
    cancel
  };
}
