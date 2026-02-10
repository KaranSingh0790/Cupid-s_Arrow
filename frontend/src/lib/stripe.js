// Stripe payment integration
// NOTE: This is a NEW file - completely separate from razorpay.js

/**
 * Detect which payment gateway to use based on user's locale/timezone
 * Returns 'razorpay' for India, 'stripe' for everywhere else
 */
export function detectPaymentGateway() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const locale = navigator.language || navigator.userLanguage || '';

        // India detection - use Razorpay for UPI support
        if (
            timezone === 'Asia/Kolkata' ||
            timezone === 'Asia/Calcutta' ||
            locale.includes('IN') ||
            locale === 'hi' ||
            locale === 'hi-IN'
        ) {
            return 'razorpay';
        }

        // Everywhere else - use Stripe
        return 'stripe';
    } catch (error) {
        // Default to Stripe if detection fails
        console.warn('Gateway detection failed, defaulting to Stripe:', error);
        return 'stripe';
    }
}

/**
 * Detect preferred currency based on user's locale/timezone
 */
export function detectCurrency() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const locale = navigator.language || '';

        // India
        if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
            return 'inr';
        }

        // UK
        if (timezone.includes('London') || locale.includes('GB') || locale === 'en-GB') {
            return 'gbp';
        }

        // Europe (common timezones)
        if (
            timezone.includes('Europe/Paris') ||
            timezone.includes('Europe/Berlin') ||
            timezone.includes('Europe/Rome') ||
            timezone.includes('Europe/Madrid') ||
            timezone.includes('Europe/Amsterdam')
        ) {
            return 'eur';
        }

        // Default: USD
        return 'usd';
    } catch (error) {
        return 'usd';
    }
}

/**
 * Get pricing for Stripe (in cents)
 */
const STRIPE_PRICES = {
    usd: { crush: 199, couple: 299 },    // $1.99, $2.99
    eur: { crush: 199, couple: 299 },    // €1.99, €2.99
    gbp: { crush: 159, couple: 249 },    // £1.59, £2.49
};

/**
 * Get Stripe price for experience type and currency
 */
export function getStripePrice(experienceType, currency = 'usd') {
    const prices = STRIPE_PRICES[currency.toLowerCase()] || STRIPE_PRICES.usd;
    return experienceType === 'CRUSH' ? prices.crush : prices.couple;
}

/**
 * Format amount in cents to display currency
 */
export function formatStripeCurrency(cents, currency = 'usd') {
    const currencySymbols = {
        usd: '$',
        eur: '€',
        gbp: '£',
    };

    const symbol = currencySymbols[currency.toLowerCase()] || '$';
    const amount = (cents / 100).toFixed(2);

    // Remove trailing zeros for whole numbers
    const formatted = amount.endsWith('.00') ? amount.slice(0, -3) : amount;

    return `${symbol}${formatted}`;
}

/**
 * Initialize Stripe payment by redirecting to Checkout
 * @param {string} checkoutUrl - Stripe Checkout URL from createStripePayment
 */
export function redirectToStripeCheckout(checkoutUrl) {
    // Simply redirect to Stripe's hosted checkout page
    window.location.href = checkoutUrl;
}

/**
 * Get gateway-specific display info
 */
export function getGatewayDisplayInfo(gateway) {
    if (gateway === 'razorpay') {
        return {
            name: 'Razorpay',
            methods: [
                { icon: '📱', label: 'UPI' },
                { icon: '💳', label: 'Card' },
                { icon: '🏦', label: 'Net' },
            ],
            currency: 'inr',
        };
    }

    return {
        name: 'Stripe',
        methods: [
            { icon: '💳', label: 'Card' },
            { icon: '', label: 'Pay' }, // Apple Pay
            { icon: '🔗', label: 'Link' },
        ],
        currency: detectCurrency(),
    };
}
