const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const audit = require('../middleware/audit');
const R = require('../utils/response');
const teamService = require('../services/teamService');
const { inviteRules, roleUpdateRules, mongoIdParam, validate } = require('../middleware/validate');

router.use(protect);

// ── GET /team ────────────────────────────────────────────────────────────────
// Returns all users in the same org (multi-tenant), or all users if no orgId
router.get('/', async (req, res, next) => {
  try {
    const members = await teamService.listTeam(req.user);
    return R.success(res, members);
  } catch (err) { next(err); }
});

// ── POST /team/invite ────────────────────────────────────────────────────────
router.post('/invite',
  adminOnly,
  inviteRules, validate,
  audit('INVITE', 'User'),
  async (req, res, next) => {
    try {
      const invitation = await teamService.inviteTeamMember(req.body, req.user);
      return R.success(res, invitation);
    } catch (err) { next(err); }
  }
);

// ── PATCH /team/:id — update role ────────────────────────────────────────────
router.patch('/:id',
  adminOnly,
  mongoIdParam(), roleUpdateRules, validate,
  audit('UPDATE_ROLE', 'User'),
  async (req, res, next) => {
    try {
      const user = await teamService.updateRole(req.params.id, req.body.role, req.user._id);
      return R.success(res, user);
    } catch (err) { next(err); }
  }
);

// ── DELETE /team/:id — remove member ────────────────────────────────────────
router.delete('/:id',
  adminOnly,
  mongoIdParam(), validate,
  audit('REMOVE', 'User'),
  async (req, res, next) => {
    try {
      const result = await teamService.removeTeamMember(req.params.id, req.user._id);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

module.exports = router;
