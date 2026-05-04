const BaseService = require('../BaseService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const supabase = require('../../config/supabase');
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
          event = JSON.parse(rawBody); 
        } catch(e) { 
          throw new AppError(Errors.BAD_REQUEST, { message: `Webhook Error: ${err.message}` });
        }
      } else {
        throw new AppError(Errors.BAD_REQUEST, { message: `Webhook Error: ${err.message}` });
      }
    }

    // 1. Immutable Audit Trail: Log every raw webhook event
    try {
      await supabase.from('stripe_events').insert([{
        stripe_event_id: event.id,
        type: event.type,
        data: event,
        processed: false
      }]);
    } catch (logErr) {
      this.logger && this.logger.error('Failed to log stripe event', { error: logErr.message });
    }

    // 2. Process Event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const userId = session.metadata.userId;
          const tier = session.metadata.tier;
          
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            status: 'active',
            plan_id: tier
          }, { onConflict: 'user_id' });

          // Update profile role if needed
          await supabase.from('profiles').update({ role: tier === 'enterprise' ? 'admin' : 'member' }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        await supabase.from('subscriptions')
          .update({ 
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_customer_id', customerId);
        break;
      }
    }

    // Mark as processed
    await supabase.from('stripe_events').update({ processed: true }).eq('stripe_event_id', event.id);

    return { received: true };
  }
}

module.exports = WebhookService;
