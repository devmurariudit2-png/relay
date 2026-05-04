const BaseService = require('../BaseService');
// Models removed
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const { AppError, Errors } = require('../../errors/AppError');

class PortalService extends BaseService {
  async run() {
    const orgId = this.user.orgId;
    const sub = await Subscription.findOne({ orgId });
    
    if (!sub || !sub.stripeCustomerId) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'No active Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/subscription`
    });

    return { url: session.url };
  }
}

module.exports = PortalService;
