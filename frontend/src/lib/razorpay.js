// Razorpay payment integration
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

// Load Razorpay script dynamically
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error('Failed to load Razorpay'))
        document.body.appendChild(script)
    })
}

/**
 * Initialize Razorpay checkout
 * @param {Object} orderDetails - Order details from createPayment function
 * @param {Function} onSuccess - Callback on successful payment
 * @param {Function} onFailure - Callback on payment failure
 */
export async function initializePayment(orderDetails, onSuccess, onFailure) {
    try {
        await loadRazorpayScript()

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: orderDetails.order.amount,
            currency: orderDetails.order.currency,
            order_id: orderDetails.order.id,
            name: "Cupid's Arrow",
            description: 'Send a romantic experience',
            image: '/heart-logo.svg',
            handler: function (response) {
                // Payment successful
                onSuccess({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                })
            },
            prefill: orderDetails.prefill || {},
            theme: {
                color: '#F43F5E',
                backdrop_color: 'rgba(0,0,0,0.4)',
            },
            modal: {
                ondismiss: function () {
                    onFailure(new Error('Payment cancelled by user'))
                },
                confirm_close: true,
                escape: false,
            },
            notes: {
                experience_id: orderDetails.experience_id,
            },
        }

        const rzp = new window.Razorpay(options)

        rzp.on('payment.failed', function (response) {
            onFailure(new Error(response.error.description || 'Payment failed'))
        })

        rzp.open()
    } catch (error) {
        onFailure(error)
    }
}

/**
 * Format amount in paise to display currency
 */
export function formatCurrency(paise) {
    return `₹${(paise / 100).toFixed(0)}`
}
