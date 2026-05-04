/**
 * Transaction Service
 * Handles all transaction-related business logic and API interactions
 */

import * as API from '../api/index.js';

class TransactionService {
  /**
   * Get all transactions with optional filters
   */
  async getTransactions(params = {}) {
    try {
      return await API.getTransactions(params);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data) {
    try {
      // Validate required fields
      if (!data.date || !data.amount || !data.description) {
        throw new Error('Missing required fields: date, amount, description');
      }
      return await API.createTransaction(data);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(id) {
    try {
      if (!id) throw new Error('Transaction ID is required');
      return await API.getTransaction(id);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Update a transaction
   */
  async updateTransaction(id, data) {
    try {
      if (!id) throw new Error('Transaction ID is required');
      return await API.updateTransaction(id, data);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id) {
    try {
      if (!id) throw new Error('Transaction ID is required');
      return await API.deleteTransaction(id);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Import transactions from CSV
   */
  async importCSV(file, source) {
    try {
      if (!file) throw new Error('File is required');
      if (!source) throw new Error('Source is required');
      if (!['bank', 'internal'].includes(source)) {
        throw new Error('Source must be either "bank" or "internal"');
      }
      return await API.importCSV(file, source);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Trigger reconciliation (returns jobId for async tracking)
   */
  async startReconciliation() {
    try {
      const result = await API.reconcile();
      // Check if result contains jobId (async) or direct results (sync)
      return {
        jobId: result.jobId || null,
        status: result.status || 'completed',
        data: result.data || result,
        message: result.message
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get reconciliation job status (for async reconciliation)
   */
  async getReconciliationStatus(jobId) {
    try {
      if (!jobId) throw new Error('Job ID is required');
      // This assumes the backend implements GET /transactions/reconcile/status/:jobId
      return await API.req('GET', `/transactions/reconcile/status/${jobId}`);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get ledger for a specific source
   */
  async getLedger(source) {
    try {
      if (!source) throw new Error('Source is required');
      return await API.getLedger(source);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get transaction summary
   */
  async getSummary() {
    try {
      return await API.getSummary();
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Format errors consistently
   */
  formatError(error) {
    return {
      message: error.message || 'An error occurred',
      status: error.status,
      errors: error.errors
    };
  }
}

export default new TransactionService();
