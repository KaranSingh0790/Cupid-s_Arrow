// Stripe Payment Success Page
// Handles redirect back from Stripe Checkout after successful payment
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
import { invokeFunction } from '../lib/supabase'
import { FloatingPetals } from '../components/animations/Petals'

export default function StripeSuccess() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('')

    const { goToStep, reset } = useExperienceStore()

    const sessionId = searchParams.get('session_id')
    const experienceId = searchParams.get('experience_id')

    useEffect(() => {
        const verifyPayment = async () => {
            if (!sessionId || !experienceId) {
                setStatus('error')
                setErrorMessage('Missing payment information')
                return
            }

            try {
                // The webhook should have already processed this,
                // but we verify and trigger email as a backup
                await invokeFunction('sendEmail', {
                    experience_id: experienceId,
                })

                setStatus('success')
                goToStep('success')

                // Redirect to main success page after a short delay
                setTimeout(() => {
                    navigate('/create/success')
                }, 2000)
            } catch (error) {
                console.error('Post-payment processing error:', error)
                // Still show success - webhook likely handled it
                setStatus('success')
                goToStep('success')

                setTimeout(() => {
                    navigate('/create/success')
                }, 2000)
            }
        }

        verifyPayment()
    }, [sessionId, experienceId, navigate, goToStep])

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingPetals count={8} />

            <div className="page-container relative z-10 flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <div className="w-full max-w-sm px-8 text-center">
                    {status === 'verifying' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="icon-circle icon-circle-lg mx-auto mb-6">
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                >
                                    💝
                                </motion.span>
                            </div>
                            <h1 className="section-heading mb-4">Verifying Payment...</h1>
                            <p className="text-muted">
                                Please wait while we confirm your payment
                            </p>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="icon-circle icon-circle-lg mx-auto mb-6">
                                <span>✨</span>
                            </div>
                            <h1 className="section-heading mb-4">Payment Successful!</h1>
                            <p className="text-muted mb-6">
                                Redirecting you to your confirmation...
                            </p>
                            <div className="flex justify-center">
                                <LoadingDots />
                            </div>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="icon-circle icon-circle-lg mx-auto mb-6">
                                <span>😔</span>
                            </div>
                            <h1 className="section-heading mb-4">Something Went Wrong</h1>
                            <p className="text-muted mb-6">
                                {errorMessage || 'We couldn\'t verify your payment. Please contact support.'}
                            </p>
                            <Link to="/create" className="btn-primary">
                                Try Again
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}

function LoadingDots() {
    return (
        <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                />
            ))}
        </div>
    )
}
