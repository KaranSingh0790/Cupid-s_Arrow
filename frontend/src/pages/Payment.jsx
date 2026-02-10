// Payment Page - Dual Gateway Support (Razorpay + Stripe)
// Elegant design matching reference screenshots - NO NAVBAR
// NOTE: All existing Razorpay logic is preserved - Stripe is additive only
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
// Razorpay - existing imports unchanged
import { initializePayment, formatCurrency } from '../lib/razorpay'
import { invokeFunction } from '../lib/supabase'
import { FloatingPetals } from '../components/animations/Petals'
// Stripe - new imports
import {
    detectPaymentGateway,
    detectCurrency,
    getStripePrice,
    formatStripeCurrency,
    redirectToStripeCheckout,
    getGatewayDisplayInfo
} from '../lib/stripe'

export default function Payment() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentError, setPaymentError] = useState(null)

    // Check for URL parameter to force gateway (for testing)
    // Usage: /create/payment?gateway=stripe OR /create/payment?gateway=razorpay
    const forceGateway = searchParams.get('gateway')

    // Auto-detect gateway based on user location (can be overridden via URL or toggle)
    const [paymentGateway, setPaymentGateway] = useState(() => {
        if (forceGateway === 'stripe' || forceGateway === 'razorpay') {
            return forceGateway
        }
        return detectPaymentGateway()
    })
    const [currency, setCurrency] = useState(() => {
        if (forceGateway === 'stripe') return 'usd'
        if (forceGateway === 'razorpay') return 'inr'
        const detected = detectCurrency()
        // If gateway is stripe but currency is inr (not supported by Stripe), default to usd
        const gateway = forceGateway || detectPaymentGateway()
        if (gateway === 'stripe' && detected === 'inr') return 'usd'
        return detected
    })

    const {
        experienceId,
        experienceType,
        recipientName,
        recipientEmail,
        amountPaise,
        createPayment,
        createStripePayment,
        goToStep,
    } = useExperienceStore()

    // Redirect if no experience
    useEffect(() => {
        if (!experienceId) {
            navigate('/create')
        }
    }, [experienceId, navigate])

    if (!experienceId) {
        return null
    }

    // Get display info based on selected gateway
    const gatewayInfo = getGatewayDisplayInfo(paymentGateway)

    // Calculate display price based on gateway
    const displayPrice = paymentGateway === 'razorpay'
        ? formatCurrency(amountPaise)
        : formatStripeCurrency(getStripePrice(experienceType, currency), currency)

    // ============================================
    // RAZORPAY PAYMENT HANDLER (UNCHANGED)
    // ============================================
    const handleRazorpayPayment = async () => {
        setIsProcessing(true)
        setPaymentError(null)

        try {
            // Create payment order via Edge Function
            const paymentOrder = await createPayment()

            // Initialize Razorpay checkout
            await initializePayment(
                {
                    ...paymentOrder,
                    experience_id: experienceId,
                },
                // Success callback
                async (response) => {
                    console.log('Payment successful:', response)

                    try {
                        // Verify payment and update experience status
                        await invokeFunction('verifyPayment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            experience_id: experienceId,
                        })
                        console.log('Payment verified successfully')

                        // Send email directly (backup to webhook)
                        try {
                            await invokeFunction('sendEmail', {
                                experience_id: experienceId,
                            })
                            console.log('Email sent successfully')
                        } catch (emailError) {
                            // Log but don't block - webhook might handle it
                            console.error('Direct email send failed (webhook may handle):', emailError)
                        }
                    } catch (verifyError) {
                        console.error('Payment verification failed:', verifyError)
                        // Still proceed - webhook should handle it
                    }

                    goToStep('success')
                    navigate('/create/success')
                },
                // Failure callback
                (error) => {
                    console.error('Payment failed:', error)
                    setPaymentError(error.message || 'Payment failed. Please try again.')
                    setIsProcessing(false)
                }
            )
        } catch (error) {
            console.error('Payment initialization failed:', error)
            setPaymentError(error.message || 'Failed to initialize payment')
            setIsProcessing(false)
        }
    }

    // ============================================
    // STRIPE PAYMENT HANDLER (NEW)
    // ============================================
    const handleStripePayment = async () => {
        setIsProcessing(true)
        setPaymentError(null)

        try {
            // Create Stripe checkout session via Edge Function
            const response = await createStripePayment(currency)

            if (response.checkout_url) {
                // Redirect to Stripe Checkout
                redirectToStripeCheckout(response.checkout_url)
            } else {
                throw new Error('No checkout URL received')
            }
        } catch (error) {
            console.error('Stripe payment initialization failed:', error)
            setPaymentError(error.message || 'Failed to initialize payment')
            setIsProcessing(false)
        }
    }

    // ============================================
    // UNIFIED PAYMENT HANDLER
    // ============================================
    const handlePayment = async () => {
        if (paymentGateway === 'razorpay') {
            await handleRazorpayPayment()
        } else {
            await handleStripePayment()
        }
    }

    // Toggle gateway (for users who want to switch)
    const toggleGateway = () => {
        const newGateway = paymentGateway === 'razorpay' ? 'stripe' : 'razorpay'
        setPaymentGateway(newGateway)
        if (newGateway === 'razorpay') {
            setCurrency('inr')
        } else {
            // detectCurrency() returns 'inr' for India, but Stripe doesn't support INR
            // Default to USD when switching to Stripe
            const detected = detectCurrency()
            setCurrency(detected === 'inr' ? 'usd' : detected)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingPetals count={6} />

            <div className="page-container relative z-10 flex items-center justify-center" style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
                <div className="w-full max-w-sm px-8">
                    {/* Progress Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="progress-container"
                    >
                        <div className="progress-bar-wrapper">
                            <span className="progress-step-text">Step 4 of 4</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '100%' }}></div>
                            </div>
                            <span className="progress-label">Order</span>
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-20"
                    >
                        <div className="icon-circle icon-circle-lg mx-auto mb-4">
                            <span>💝</span>
                        </div>
                        <h1 className="section-heading">Complete Your Order</h1>
                        <p style={{ marginBottom: '2.5rem' }}>
                            Send your personalized experience to <strong style={{ color: 'var(--color-gray-700)' }}>{recipientName}</strong>
                        </p>
                    </motion.div>

                    {/* Order Summary Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="order-summary"
                        style={{ marginBottom: '0.5rem' }}
                    >
                        <div className="order-summary-label">Order Summary</div>

                        <div className="order-item">
                            <div className="order-item-info">
                                <span className="order-item-icon">{experienceType === 'CRUSH' ? '💕' : '👩‍❤️‍👨'}</span>
                                <div>
                                    <div className="order-item-name">
                                        {experienceType === 'CRUSH' ? 'Crush Mode' : 'Couple Mode'}
                                    </div>
                                    <div className="order-item-description">
                                        Personalized timeline & messages
                                    </div>
                                </div>
                            </div>
                            <span className="order-item-price">{displayPrice}</span>
                        </div>

                        <div className="order-recipient">
                            <span>Recipient</span>
                            <span>{recipientEmail}</span>
                        </div>

                        <div className="order-total">
                            <span className="order-total-label">Total</span>
                            <span className="order-total-price">{displayPrice}</span>
                        </div>
                    </motion.div>

                    {/* Payment Methods & Button Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="glass-card p-6 text-center"
                        style={{ marginBottom: '0.5rem' }}
                    >
                        {/* Payment methods - dynamic based on gateway */}
                        <div className="payment-methods">
                            <div className="payment-methods-label">Pay Securely With</div>
                            <div className="payment-icons">
                                {gatewayInfo.methods.map((method, index) => (
                                    <div className="payment-icon" key={index}>
                                        <span>{method.icon}</span>
                                        <span>{method.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pay button */}
                        <motion.button
                            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="btn-primary w-2/3"
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <LoadingSpinner />
                                    Processing...
                                </span>
                            ) : (
                                <>Pay {displayPrice} →</>
                            )}
                        </motion.button>

                        {paymentError && (
                            <motion.div

                                style={{
                                    marginTop: '0.5rem',
                                    color: '#651414ff',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                }}
                            >
                                {paymentError}
                            </motion.div>
                        )}

                        {/* Gateway toggle - subtle link */}
                        <div className="text-center" style={{ marginTop: '0.75rem' }}>
                            <button
                                onClick={toggleGateway}
                                disabled={isProcessing}
                                className="text-xs"
                                style={{
                                    color: 'var(--color-gray-500)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    opacity: 0.7
                                }}
                            >
                                {paymentGateway === 'razorpay'
                                    ? 'Pay with international card instead'
                                    : 'Pay with UPI/Indian methods instead'}
                            </button>
                        </div>

                        {/* Back link */}
                        <div className="text-center" style={{ marginTop: '0.5rem' }}>
                            <button
                                onClick={() => navigate('/create/preview')}
                                disabled={isProcessing}
                                className="btn-ghost"
                            >
                                ← Back to preview
                            </button>
                        </div>
                    </motion.div>



                    {/* What happens next */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="what-next-card"
                        style={{ marginTop: '0.5rem' }}
                    >
                        <h4 className="what-next-title text-center">What happens next?</h4>
                        <div className="what-next-list">
                            <div className="what-next-item">
                                <span className="what-next-number">1</span>
                                <span className="what-next-text">
                                    Payment is processed securely. You'll receive a confirmation receipt immediately.
                                </span>
                            </div>
                            <div className="what-next-item">
                                <span className="what-next-number">2</span>
                                <span className="what-next-text">
                                    A beautiful, personalized email is sent to <strong>{recipientName}</strong> within seconds.
                                </span>
                            </div>
                            <div className="what-next-item">
                                <span className="what-next-number">3</span>
                                <span className="what-next-text">
                                    They click the unique link to experience your memories, messages, and your final special proposal.
                                </span>
                            </div>
                        </div>
                    </motion.div>


                </div>
            </div>
        </div>
    )
}

function LoadingSpinner() {
    return (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    )
}
