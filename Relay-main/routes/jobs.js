const router = require('express').Router();
const { protect } = require('../middleware/supabaseAuth');
const jobService = require('../services/jobService');
const R = require('../utils/response');

router.use(protect);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get background job status
 *     description: Retrieve the current state (pending, processing, completed, failed) of a background job by its UUID.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string }, description: 'Job UUID' }
 *     responses:
 *       200: { description: Job status object }
 *       404: { description: Job not found }
 */
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
