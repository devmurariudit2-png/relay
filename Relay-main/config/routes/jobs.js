const router = require('express').Router();
const { protect } = require('../middleware/auth');
const jobService = require('../services/jobService');
const R = require('../utils/response');

router.use(protect);

// GET /jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const job = jobService.getJob(req.params.id);
    if (!job) return R.notFound(res, 'Job not found');
    return R.success(res, job);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
