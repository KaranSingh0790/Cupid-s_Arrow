// Preview Page - Full experience preview with locked CTA
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
import { FloatingPetals } from '../components/animations/Petals'
import CrushExperience from '../components/experience/CrushExperience'
import CoupleExperience from '../components/experience/CoupleExperience'
import { formatCurrency } from '../lib/razorpay'

export default function Preview() {
    const navigate = useNavigate()
    const [showPreview, setShowPreview] = useState(false)

    const {
        experienceType,
        recipientName,
        senderName,
        content,
        amountPaise,
        experienceId,
    } = useExperienceStore()

    // Redirect if no experience created
    if (!experienceId) {
        navigate('/create')
        return null
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <FloatingPetals count={8} />

            <div className="relative z-10 min-h-screen py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="text-4xl mb-3">👀</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Preview Your Experience
                        </h1>
                        <p className="text-gray-600">
                            See exactly what {recipientName} will receive
                        </p>
                    </motion.div>

                    {/* Preview container */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card overflow-hidden relative"
                    >
                        {/* Watermark */}
                        <div className="absolute top-4 right-4 z-20 bg-white/90 px-3 py-1 rounded-full text-xs text-gray-500 flex items-center gap-1">
                            <span>🔒</span> Preview Mode
                        </div>

                        {/* Experience preview */}
                        <div className="relative">
                            {!showPreview ? (
                                <PreviewPlaceholder
                                    experienceType={experienceType}
                                    recipientName={recipientName}
                                    onPlay={() => setShowPreview(true)}
                                />
                            ) : (
                                <div className="p-6">
                                    {experienceType === 'CRUSH' ? (
                                        <CrushExperience
                                            recipientName={recipientName}
                                            senderName={senderName}
                                            content={content}
                                            isPreview={true}
                                        />
                                    ) : (
                                        <CoupleExperience
                                            recipientName={recipientName}
                                            senderName={senderName}
                                            content={content}
                                            isPreview={true}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Locked CTA overlay */}
                        <div className="p-6 bg-gradient-to-t from-white via-white to-transparent">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-4">
                                    The final interaction is locked until you send it
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 flex flex-col gap-4"
                    >
                        {/* Unlock button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/create/payment')}
                            className="btn-primary w-full text-lg py-5"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <span>Unlock & Send for {formatCurrency(amountPaise)}</span>
                                <span>→</span>
                            </span>
                        </motion.button>

                        <button
                            onClick={() => navigate('/create/form')}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            ← Edit experience
                        </button>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 text-center text-sm text-gray-400"
                    >
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                            <span>🔒 Secure payment</span>
                            <span>•</span>
                            <span>📧 Instant delivery</span>
                            <span>•</span>
                            <span>💕 UPI supported</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

function PreviewPlaceholder({ experienceType, recipientName, onPlay }) {
    return (
        <div className="p-12 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6"
            >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                    <span className="text-4xl">
                        {experienceType === 'CRUSH' ? '💕' : '💑'}
                    </span>
                </div>
            </motion.div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Experience for {recipientName}
            </h3>
            <p className="text-gray-500 mb-6">
                {experienceType === 'CRUSH'
                    ? 'A secret admiration with playful proposal'
                    : 'A beautiful journey of your memories together'}
            </p>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlay}
                className="btn-secondary inline-flex items-center gap-2"
            >
                <span>▶</span> Play Preview
            </motion.button>
        </div>
    )
}
