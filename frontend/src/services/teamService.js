/**
 * Team Service
 * Handles all team/collaboration-related business logic and API interactions
 */

import * as API from '../api/index.js';

class TeamService {
  /**
   * Get all team members
   */
  async getTeamMembers() {
    try {
      return await API.getTeamMembers();
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Invite a team member
   */
  async inviteTeamMember(email, role) {
    try {
      if (!email) throw new Error('Email is required');
      if (!role) throw new Error('Role is required');
      
      this.validateEmail(email);
      this.validateRole(role);
      
      return await API.inviteTeamMember(email, role);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(memberId, role) {
    try {
      if (!memberId) throw new Error('Member ID is required');
      if (!role) throw new Error('Role is required');
      
      this.validateRole(role);
      
      return await API.updateTeamMemberRole(memberId, role);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Remove a team member
   */
  async removeTeamMember(memberId) {
    try {
      if (!memberId) throw new Error('Member ID is required');
      return await API.removeTeamMember(memberId);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Check if user has permission for action
   */
  hasPermission(userRole, requiredRole) {
    const roleHierarchy = { viewer: 0, member: 1, admin: 2 };
    const userLevel = roleHierarchy[userRole] || -1;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }

  /**
   * Check if user can write (member or admin)
   */
  canWrite(userRole) {
    return ['member', 'admin'].includes(userRole);
  }

  /**
   * Check if user can manage team (admin only)
   */
  canManageTeam(userRole) {
    return userRole === 'admin';
  }

  /**
   * Get allowed roles for team member assignment
   */
  getAllowedRoles(userRole) {
    if (userRole === 'admin') {
      return ['admin', 'member', 'viewer'];
    }
    return []; // Only admins can invite
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
   * Validate role
   */
  validateRole(role) {
    if (!['admin', 'member', 'viewer'].includes(role)) {
      throw new Error('Role must be admin, member, or viewer');
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

export default new TeamService();
