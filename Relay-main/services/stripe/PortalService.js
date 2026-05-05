const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const { AppError, Errors } = require('../../errors/AppError');

class PortalService extends BaseService {
  async run() {
    const userId = this.user.id || this.user._id;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (!profile || !profile.stripe_customer_id) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'No active Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/subscription`
    });

    return { url: session.url };
  }
}

module.exports = PortalService;
