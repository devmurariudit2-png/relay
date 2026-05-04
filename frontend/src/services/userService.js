/**
 * User Service
 * Handles all user-related business logic and API interactions
 */

import { supabase } from '../supabase';
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
      return await API.login(email, password);
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
      // Removed complex password validation to match Supabase defaults unless needed
      
      return await API.register(name, email, password);
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
      return await API.changePassword(currentPassword, newPassword);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/signin';
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  /**
   * Get stored token
   */
  async getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
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

export default new UserService();
