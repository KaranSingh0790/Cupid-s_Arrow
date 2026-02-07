// Success Page - After successful payment
// Elegant celebration design
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
import { HeartConfetti, FloatingHearts } from '../components/animations/Petals'

export default function Success() {
    const navigate = useNavigate()
    const { experienceId, recipientName, recipientEmail, reset } = useExperienceStore()

    // Show confetti on mount
    useEffect(() => {
        // Could add sound effect here
    }, [])

    const displayName = recipientName || 'your special someone'
    const displayEmail = recipientEmail || 'their email'

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingHearts count={8} />
            <HeartConfetti isActive={true} />

            <div className="page-container relative z-10">
                <div className="content-centered text-center px-4">
                    <div className="experience-card" style={{ maxWidth: '520px', padding: '3rem' }}>
                        {/* Success animation */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                                delay: 0.1
                            }}
                            style={{ marginBottom: '2rem' }}
                        >
                            <div
                                className="w-28 h-28 mx-auto rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-rose-400), var(--color-primary))',
                                    boxShadow: '0 8px 32px rgba(225, 29, 72, 0.3)'
                                }}
                            >
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: 'spring' }}
                                    className="text-5xl"
                                >
                                    ✨
                                </motion.span>
                            </div>
                        </motion.div>

                        {/* Success message */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{ marginBottom: '2rem' }}
                        >
                            <h1 className="section-heading" style={{ marginBottom: '0.75rem' }}>
                                Your Love is on its Way!
                            </h1>
                            <p style={{ color: 'var(--color-gray-600)' }}>
                                A beautiful email has been sent to <strong>{displayName}</strong>
                            </p>
                        </motion.div>

                        {/* Email sent info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="rounded-xl text-left"
                            style={{
                                background: 'var(--color-rose-50)',
                                marginBottom: '2rem',
                                padding: '1.5rem'
                            }}
                        >
                            <div className="form-section-label mb-3">Email Sent Successfully</div>

                            <div className="what-next-list" style={{ gap: '0.75rem' }}>
                                <div className="what-next-item">
                                    <span style={{ color: 'var(--color-primary)' }}>✓</span>
                                    <span className="what-next-text">
                                        {displayName} will receive an email at {displayEmail}
                                    </span>
                                </div>
                                <div className="what-next-item">
                                    <span style={{ color: 'var(--color-primary)' }}>✓</span>
                                    <span className="what-next-text">
                                        They'll click the link to experience your creation
                                    </span>
                                </div>
                                <div className="what-next-item">
                                    <span style={{ color: 'var(--color-primary)' }}>✓</span>
                                    <span className="what-next-text">
                                        The full romantic experience will play just for them
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Action buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-4"
                        >
                            <Link to="/" onClick={() => reset()}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="btn-primary w-full"
                                >
                                    Create Another Experience
                                </motion.button>
                            </Link>

                            <Link to="/" className="block" style={{ marginTop: '1rem' }}>
                                <button className="btn-ghost">
                                    Back to Home
                                </button>
                            </Link>
                        </motion.div>
                    </div>


                </div>
            </div>
        </div>
    )
}
