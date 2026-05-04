const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const audit = require('../middleware/audit');
const R = require('../utils/response');
const teamService = require('../services/teamService');
const { inviteRules, roleUpdateRules, mongoIdParam, validate } = require('../middleware/validate');
const GetTeamService = require('../services/team/GetTeamService');
const InviteMemberService = require('../services/team/InviteMemberService');
const UpdateRoleService = require('../services/team/UpdateRoleService');
const RemoveMemberService = require('../services/team/RemoveMemberService');

const InviteToken = require('../models/InviteToken');

/**
 * @openapi
 * /team/join:
 *   post:
 *     tags: [Team]
 *     summary: Join a team using an invite token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, name, password]
 *             properties:
 *               token:    { type: string }
 *               name:     { type: string }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Successfully joined }
 *       400: { description: Invalid or expired token }
 */
router.post('/join', async (req, res, next) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !name || !password || password.length < 6)
      return R.badRequest(res, 'Valid token, name, and password (min 6 chars) required');

    const invite = await InviteToken.findOne({ token, expiresAt: { $gt: Date.now() } });
    if (!invite) return R.badRequest(res, 'Invalid or expired invite token');

    const jwt = require('jsonwebtoken');
    const user = await User.create({
      name,
      email: invite.email,
      password,
      orgId: invite.orgId,
      orgName: invite.orgName,
      role: invite.role
    });

    await InviteToken.findByIdAndDelete(invite._id);

    return R.success(res, {
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' }),
      user: user.toSafeObject()
    });
  } catch (err) { next(err); }
});

router.use(protect);

/**
 * @openapi
 * /team:
 *   get:
 *     tags: [Team]
 *     summary: Get all team members in the same organization
 *     responses:
 *       200: { description: Array of team members }
 */
// ── GET /team ────────────────────────────────────────────────────────────────
// Returns all users in the same org (multi-tenant), or all users if no orgId
router.get('/', async (req, res, next) => {
  try {
    const members = await GetTeamService.execute({user : req.user}, req.context);
    return R.success(res, members);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /team/invite:
 *   post:
 *     tags: [Team]
 *     summary: Invite a new team member (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name]
 *             properties:
 *               email: { type: string, format: email, example: newuser@example.com }
 *               name:  { type: string, example: John Smith }
 *               role:  { type: string, enum: [admin, member, viewer], default: member }
 *     responses:
 *       200: { description: Invitation sent }
 */
// ── POST /team/invite ────────────────────────────────────────────────────────
router.post('/invite',
  adminOnly,
  inviteRules, validate,
  audit('INVITE', 'User'),
  async (req, res, next) => {
    try {
      const result = await InviteMemberService.execute(req.body, req.context);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /team/{id}:
 *   patch:
 *     tags: [Team]
 *     summary: Update team member role (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, member, viewer] }
 *     responses:
 *       200: { description: Role updated }
 *       401: { description: Unauthorized }
 *       403: { description: Admin only }
 */
// ── PATCH /team/:id — update role ────────────────────────────────────────────
router.patch('/:id',
  adminOnly,
  mongoIdParam(), roleUpdateRules, validate,
  audit('UPDATE_ROLE', 'User'),
  async (req, res, next) => {
    try {
      const result = await UpdateRoleService.execute(
        { targetUserId: req.params.id, ...req.body },
        req.context
      );
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /team/{id}:
 *   delete:
 *     tags: [Team]
 *     summary: Remove a team member (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Member removed }
 *       401: { description: Unauthorized }
 *       403: { description: Admin only }
 */
// ── DELETE /team/:id — remove member ────────────────────────────────────────
router.delete('/:id',
  adminOnly,
  mongoIdParam(), validate,
  audit('REMOVE', 'User'),
  async (req, res, next) => {
    try {
      const result = await RemoveMemberService.execute({ targetUserId: req.params.id }, req.context);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

module.exports = router;
