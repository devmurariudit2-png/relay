const BaseService = require('../BaseService');
const Subscription = require('../../models/Subscription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const { AppError, Errors } = require('../../errors/AppError');

// Map tier names to Stripe Price IDs
const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_1MockStarter',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_1MockGrowth',
  scale: process.env.STRIPE_PRICE_SCALE || 'price_1MockScale',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_1MockEnterprise'
};

const tierPricing = {
  starter: { amount: 29900, name: 'Relay Starter Plan' },
  growth: { amount: 99900, name: 'Relay Growth Plan' },
  scale: { amount: 349900, name: 'Relay Scale Plan' },
  enterprise: { amount: 750000, name: 'Relay Enterprise Plan' }
};

class CreateCheckoutService extends BaseService {
  async run() {
    const { tier } = this.args;

    if (!tierPricing[tier]) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'Invalid tier' });
    }

    const priceId = await this.getValidPriceId(tier);

    const orgId = this.user.orgId;
    let sub = await Subscription.findOne({ orgId });
    if (!sub) {
      sub = await Subscription.create({ orgId });
    }

    // Create or retrieve customer
    let customerId = sub.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: this.user.email,
        metadata: { orgId }
      });
      customerId = customer.id;
      sub.stripeCustomerId = customerId;
      await sub.save();
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/subscription?canceled=true`,
      metadata: { orgId, tier }
    });

    return { url: session.url };
  }

  async getValidPriceId(tier) {
    let priceId = STRIPE_PRICES[tier];
    if (!priceId || priceId.startsWith('price_1Mock')) {
      // 1. Check if we already created it in Stripe
      const existingProducts = await stripe.products.list({ active: true, limit: 100 });
      let product = existingProducts.data.find(p => p.name === tierPricing[tier].name);
      
      if (product) {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        if (prices.data.length > 0) {
          STRIPE_PRICES[tier] = prices.data[0].id; // Cache it
          return prices.data[0].id;
        }
      }

      // 2. Otherwise create it
      product = await stripe.products.create({ name: tierPricing[tier].name });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tierPricing[tier].amount,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      STRIPE_PRICES[tier] = price.id;
      return price.id;
    }
    return priceId;
  }
}

module.exports = CreateCheckoutService;
