// Payment Page - Razorpay checkout integration
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
import { initializePayment, formatCurrency } from '../lib/razorpay'
import { FloatingPetals } from '../components/animations/Petals'

export default function Payment() {
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentError, setPaymentError] = useState(null)

    const {
        experienceId,
        experienceType,
        recipientName,
        recipientEmail,
        amountPaise,
        createPayment,
        goToStep,
    } = useExperienceStore()

    // Redirect if no experience
    if (!experienceId) {
        navigate('/create')
        return null
    }

    const handlePayment = async () => {
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

    return (
        <div className="min-h-screen relative overflow-hidden">
            <FloatingPetals count={6} />

            <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    {/* Payment card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8"
                    >
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="text-4xl mb-3">💝</div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                Complete Your Order
                            </h1>
                            <p className="text-gray-600">
                                Send your experience to {recipientName}
                            </p>
                        </div>

                        {/* Order summary */}
                        <div className="bg-rose-50/50 rounded-xl p-5 mb-6">
                            <h3 className="text-sm font-medium text-gray-600 mb-4">Order Summary</h3>

                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-600">
                                    {experienceType === 'CRUSH' ? '💕 Crush Mode' : '💑 Couple Mode'}
                                </span>
                                <span className="font-semibold">{formatCurrency(amountPaise)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                                <span>Recipient</span>
                                <span>{recipientEmail}</span>
                            </div>

                            <div className="border-t border-rose-200/50 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-800">Total</span>
                                    <span className="text-xl font-bold text-rose-500">
                                        {formatCurrency(amountPaise)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment methods */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 text-center mb-3">
                                Pay securely with
                            </p>
                            <div className="flex justify-center gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <span>📱</span> UPI
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <span>💳</span> Card
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <span>🏦</span> Net Banking
                                </span>
                            </div>
                        </div>

                        {/* Error message */}
                        {paymentError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                            >
                                {paymentError}
                            </motion.div>
                        )}

                        {/* Pay button */}
                        <motion.button
                            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="btn-primary w-full text-lg py-4 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <LoadingSpinner />
                                    Processing...
                                </span>
                            ) : (
                                <>Pay {formatCurrency(amountPaise)}</>
                            )}
                        </motion.button>

                        {/* Back link */}
                        <button
                            onClick={() => navigate('/create/preview')}
                            disabled={isProcessing}
                            className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50"
                        >
                            ← Back to preview
                        </button>

                        {/* Trust badges */}
                        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400 mb-2">
                                Secured by Razorpay
                            </p>
                            <div className="flex justify-center gap-2 text-xs text-gray-400">
                                <span>🔒 256-bit encryption</span>
                                <span>•</span>
                                <span>✓ PCI DSS compliant</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* What happens next */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 glass-card p-5"
                    >
                        <h4 className="font-medium text-gray-700 mb-3">What happens next?</h4>
                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex gap-2">
                                <span>1.</span>
                                <span>Payment is processed securely</span>
                            </div>
                            <div className="flex gap-2">
                                <span>2.</span>
                                <span>Beautiful email is sent to {recipientName}</span>
                            </div>
                            <div className="flex gap-2">
                                <span>3.</span>
                                <span>They click the link and experience your message</span>
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
