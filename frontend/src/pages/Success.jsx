// Success Page - After successful payment
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
        // Reset store after showing success (with delay)
        const timer = setTimeout(() => {
            // Keep experienceId for potential sharing but reset form
        }, 3000)
        return () => clearTimeout(timer)
    }, [])

    // Allow direct access for testing, but normally check for experienceId
    const displayName = recipientName || 'your special someone'
    const displayEmail = recipientEmail || 'their email'

    return (
        <div className="min-h-screen relative overflow-hidden">
            <FloatingHearts count={10} />
            <HeartConfetti isActive={true} />

            <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full text-center">
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
                        className="mb-8"
                    >
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-lg">
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring' }}
                                className="text-6xl"
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
                    >
                        <h1 className="text-3xl font-bold text-gray-800 mb-3">
                            Your Love is on its Way!
                        </h1>
                        <p className="text-gray-600 mb-6">
                            A beautiful email has been sent to {displayName} at {displayEmail}
                        </p>
                    </motion.div>

                    {/* Info card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-6 mb-8 text-left"
                    >
                        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <span>📧</span> Email Sent Successfully
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-rose-500 mt-0.5">✓</span>
                                <span className="text-gray-600">
                                    {displayName} will receive an email with a beautiful message
                                </span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-rose-500 mt-0.5">✓</span>
                                <span className="text-gray-600">
                                    They'll click the link to experience your creation
                                </span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-rose-500 mt-0.5">✓</span>
                                <span className="text-gray-600">
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
                        <Link to="/">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => reset()}
                                className="btn-primary w-full"
                            >
                                Create Another Experience
                            </motion.button>
                        </Link>

                        <Link to="/" className="block">
                            <button className="text-gray-500 hover:text-gray-700 text-sm">
                                Back to Home
                            </button>
                        </Link>
                    </motion.div>

                    {/* Footer message */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-10 text-sm text-gray-400"
                    >
                        Thank you for spreading love with Cupid's Arrow 💕
                    </motion.p>
                </div>
            </div>
        </div>
    )
}
