const router = require('express').Router();
const { protect } = require('../middleware/supabaseAuth');
const R = require('../utils/response');

const CreateCheckoutService = require('../services/stripe/CreateCheckoutService');
const PortalService = require('../services/stripe/PortalService');
const WebhookService = require('../services/stripe/WebhookService');
const GetStatusService = require('../services/stripe/GetStatusService');

/**
 * @openapi
 * /stripe/create-checkout:
 *   post:
 *     tags: [Stripe]
 *     summary: Create a Stripe checkout session to upgrade subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tier]
 *             properties:
 *               tier: { type: string, enum: [starter, growth, scale, enterprise] }
 *     responses:
 *       200: { description: Returns Stripe checkout URL }
 */
router.post('/create-checkout', protect, async (req, res, next) => {
  try {
    const result = await CreateCheckoutService.execute({ tier: req.body.tier }, req.context);
    return R.success(res, result);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /stripe/portal:
 *   post:
 *     tags: [Stripe]
 *     summary: Create a Stripe customer portal session
 *     responses:
 *       200: { description: Returns Stripe portal URL }
 */
router.post('/portal', protect, async (req, res, next) => {
  try {
    const result = await PortalService.execute({}, req.context);
    return R.success(res, result);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /stripe/webhook:
 *   post:
 *     tags: [Stripe]
 *     summary: Stripe webhook handler (no auth)
 *     security: []
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const sig = req.headers['stripe-signature'];
    
    // We pass a dummy context because webhooks are not authenticated
    const context = { logger: req.context?.logger, traceId: req.context?.traceId };
    await WebhookService.execute({ rawBody, sig }, context);
    
    res.json({ received: true });
  } catch (err) {
    console.error('Error handling webhook:', err);
    res.status(err.code === 400 ? 400 : 500).end();
  }
});

/**
 * @openapi
 * /stripe/status:
 *   get:
 *     tags: [Stripe]
 *     summary: Get the current subscription status
 *     responses:
 *       200: { description: Returns Subscription object }
 */
router.get('/status', protect, async (req, res, next) => {
  try {
    const sub = await GetStatusService.execute({}, req.context);
    return R.success(res, sub);
  } catch (err) { next(err); }
});

module.exports = router;
