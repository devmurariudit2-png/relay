const BaseService = require('../BaseService');
const Subscription = require('../../models/Subscription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const { AppError, Errors } = require('../../errors/AppError');

class WebhookService extends BaseService {
  async run() {
    const { rawBody, sig } = this.args;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        try { 
          // Fallback parsing for manual testing without raw webhook signature
          event = JSON.parse(rawBody); 
        } catch(e) { 
          throw new AppError(Errors.BAD_REQUEST, { message: `Webhook Error: ${err.message}` });
        }
      } else {
        throw new AppError(Errors.BAD_REQUEST, { message: `Webhook Error: ${err.message}` });
      }
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const orgId = session.metadata.orgId;
          const tier = session.metadata.tier;
          await Subscription.findOneAndUpdate(
            { orgId },
            { 
              stripeSubscriptionId: session.subscription,
              tier,
              status: 'active'
            }
          );
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        await Subscription.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { 
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          }
        );
        break;
      }
      default:
        this.logger && this.logger.info(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}

module.exports = WebhookService;
