/**
 * User Service
 * Handles all user-related business logic and API interactions
 */

import * as API from '../api/index.js';

class UserService {
  /**
   * Authenticate user with email and password
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      const response = await API.login(email, password);
      if (response.token) {
        localStorage.setItem('rec_token', response.token);
      }
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Register a new user
   */
  async register(name, email, password) {
    try {
      if (!name || !email || !password) {
        throw new Error('Name, email, and password are required');
      }
      this.validateEmail(email);
      this.validatePassword(password);
      
      const response = await API.register(name, email, password);
      if (response.token) {
        localStorage.setItem('rec_token', response.token);
      }
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    try {
      return await API.getMe();
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Profile data is required');
      }
      return await API.updateProfile(data);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Current and new passwords are required');
      }
      this.validatePassword(newPassword);
      return await API.changePassword(currentPassword, newPassword);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Logout current user
   */
  logout() {
    localStorage.removeItem('rec_token');
    window.location.href = '/signin';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('rec_token');
  }

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem('rec_token');
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }

  /**
   * Format and log errors consistently
   */
  formatError(error) {
    console.error('[UserService] Error:', error);
    return {
      message: error.message || 'An error occurred',
      status: error.status,
      errors: error.errors
    };
  }
}

export default new UserService();
