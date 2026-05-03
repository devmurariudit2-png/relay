/**
 * Ticket Service
 * Handles all ticket-related business logic and API interactions
 */

import * as API from '../api/index.js';

class TicketService {
  /**
   * Get all tickets with optional filters
   */
  async getTickets(params = {}) {
    try {
      return await API.getTickets(params);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(data) {
    try {
      // Validate required fields
      if (!data.title || !data.description) {
        throw new Error('Title and description are required');
      }
      if (!['low', 'medium', 'high'].includes(data.priority)) {
        throw new Error('Priority must be low, medium, or high');
      }
      return await API.createTicket(data);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get a specific ticket by ID
   */
  async getTicket(id) {
    try {
      if (!id) throw new Error('Ticket ID is required');
      return await API.getTicket(id);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Update a ticket
   */
  async updateTicket(id, data) {
    try {
      if (!id) throw new Error('Ticket ID is required');
      
      // Validate status if provided
      if (data.status && !['open', 'in-progress', 'closed', 'resolved'].includes(data.status)) {
        throw new Error('Invalid ticket status');
      }
      
      // Validate priority if provided
      if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
        throw new Error('Priority must be low, medium, or high');
      }
      
      return await API.updateTicket(id, data);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(id) {
    try {
      if (!id) throw new Error('Ticket ID is required');
      return await API.deleteTicket(id);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(tickets = []) {
    try {
      return {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        byPriority: {
          low: tickets.filter(t => t.priority === 'low').length,
          medium: tickets.filter(t => t.priority === 'medium').length,
          high: tickets.filter(t => t.priority === 'high').length,
        }
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Filter tickets by status
   */
  filterByStatus(tickets = [], status) {
    try {
      if (!['open', 'in-progress', 'closed', 'resolved'].includes(status)) {
        throw new Error('Invalid status filter');
      }
      return tickets.filter(t => t.status === status);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Filter tickets by priority
   */
  filterByPriority(tickets = [], priority) {
    try {
      if (!['low', 'medium', 'high'].includes(priority)) {
        throw new Error('Invalid priority filter');
      }
      return tickets.filter(t => t.priority === priority);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Format and log errors consistently
   */
  formatError(error) {
    console.error('[TicketService] Error:', error);
    return {
      message: error.message || 'An error occurred',
      status: error.status,
      errors: error.errors
    };
  }
}

export default new TicketService();
