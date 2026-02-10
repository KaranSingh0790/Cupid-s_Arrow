// Stripe Payment Cancel Page
// Handles redirect back from Stripe Checkout when user cancels
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { FloatingPetals } from '../components/animations/Petals'

export default function StripeCancel() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const experienceId = searchParams.get('experience_id')

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingPetals count={4} />

            <div className="page-container relative z-10 flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <div className="w-full max-w-sm px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="icon-circle icon-circle-lg mx-auto mb-6">
                            <span>💔</span>
                        </div>

                        <h1 className="section-heading mb-4">Payment Cancelled</h1>

                        <p className="text-muted mb-8">
                            No worries! Your experience is still saved and you can complete the payment whenever you're ready.
                        </p>

                        <div className="space-y-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/create/payment')}
                                className="btn-primary w-full"
                            >
                                Try Again →
                            </motion.button>

                            <button
                                onClick={() => navigate('/create/preview')}
                                className="btn-ghost w-full"
                            >
                                ← Back to Preview
                            </button>
                        </div>

                        <p className="text-muted text-sm mt-8">
                            Having trouble? <a href="mailto:support@cupidsarrow.app" className="text-primary underline">Contact Support</a>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
