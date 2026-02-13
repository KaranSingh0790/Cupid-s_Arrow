// Payment Utilities — Manual UPI + PayPal (No Gateways)
// HDFC-safe: minimal UPI deep link (no tn, no special chars)

// =============================================
// CONFIG
// =============================================
export const UPI_ID = '7056223877@kotak'
const PAYEE_NAME = 'CupidsArrow'              // No spaces, no apostrophes, no special chars
const PAYPAL_USERNAME = 'KaranS669'

// Pricing
const PRICES = {
    inr: { crush: 49, couple: 99 },
    usd: { crush: 1.99, couple: 2.99 },
}

// =============================================
// REGION DETECTION
// =============================================

export function isIndiaUser() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        const locale = navigator.language || ''
        return (
            tz === 'Asia/Kolkata' ||
            tz === 'Asia/Calcutta' ||
            locale.includes('IN') ||
            locale === 'hi' ||
            locale === 'hi-IN'
        )
    } catch {
        return false
    }
}

export function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
    )
}

// =============================================
// PRICING
// =============================================

export function getPrice(experienceType, isIndia = true) {
    const region = isIndia ? 'inr' : 'usd'
    const prices = PRICES[region]
    return experienceType === 'CRUSH' ? prices.crush : prices.couple
}

export function formatPrice(experienceType, isIndia = true) {
    const price = getPrice(experienceType, isIndia)
    return isIndia ? `₹${price}` : `$${price.toFixed(2)}`
}

// =============================================
// ORDER REF (for cross-referencing in admin email)
// =============================================

export function getOrderRef(experienceId) {
    if (experienceId) {
        return `VA-${experienceId.replace(/-/g, '').substring(0, 8).toUpperCase()}`
    }
    return `VA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}

// =============================================
// UPI DEEP LINK — MINIMAL FORMAT (HDFC-SAFE)
// =============================================
//
// ONLY: pa, pn, am, cu
// NO: tn (transaction note) — causes HDFC failures
// NO: emojis, special chars, order refs
// NO: URLSearchParams — encodes @ which breaks VPA
//

export function getUPIDeepLink(amount) {
    const am = Number(amount).toFixed(2)
    return `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&am=${am}&cu=INR`
}

/**
 * QR data = same minimal UPI URI
 */
export function getUPIQRData(amount) {
    return getUPIDeepLink(amount)
}

// =============================================
// PAYPAL LINK (International)
// =============================================

export function getPayPalLink(amount) {
    return `https://paypal.me/${PAYPAL_USERNAME}/${amount}USD`
}

// =============================================
// DISPLAY INFO for UI
// =============================================

export function getPaymentDisplayInfo(isIndia) {
    if (isIndia) {
        return {
            name: 'UPI',
            methods: [
                { icon: '📱', label: 'GPay' },
                { icon: '💰', label: 'PhonePe' },
                { icon: '🏦', label: 'Paytm' },
            ],
        }
    }
    return {
        name: 'PayPal',
        methods: [
            { icon: '🌐', label: 'PayPal' },
            { icon: '💳', label: 'Card' },
            { icon: '🔒', label: 'Secure' },
        ],
    }
}
