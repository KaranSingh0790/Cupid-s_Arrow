// Preview Page - Full experience preview with locked CTA
// Elegant design matching reference screenshots - NO NAVBAR
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
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
    useEffect(() => {
        if (!experienceId) {
            navigate('/create')
        }
    }, [experienceId, navigate])

    if (!experienceId) {
        return null
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
                            <span className="progress-step-text">Step 3 of 4</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '75%' }}></div>
                            </div>
                            <span className="progress-label">Preview</span>
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-6"
                    >
                        <h1 className="section-heading" style={{ marginTop: '2rem' }}>Preview Your Experience</h1>
                        <p style={{ marginBottom: '1.5rem' }}>
                            See exactly what {recipientName} will receive
                        </p>
                    </motion.div>

                    {/* Preview container */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card overflow-hidden relative"
                    >
                        {/* Preview badge */}
                        <div
                            className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs flex items-center gap-1"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: 'var(--color-gray-500)',
                                boxShadow: 'var(--shadow-sm)',
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em'
                            }}
                        >
                            <span>🔒</span> Preview Mode
                        </div>

                        {/* Experience preview */}
                        <div className="relative">
                            {!showPreview ? (
                                <PreviewPlaceholder
                                    experienceType={experienceType}
                                    recipientName={recipientName}
                                    senderName={senderName}
                                    onPlay={() => setShowPreview(true)}
                                />
                            ) : (
                                <div style={{ padding: '1rem', maxWidth: '360px', margin: '0 auto' }}>
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
                    </motion.div>

                    {/* Action section - clearly below the card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
                    >
                        {/* Unlock button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/create/payment')}
                            className="btn-primary"
                            style={{ maxWidth: '280px', width: '100%' }}
                        >
                            Unlock & Send for {formatCurrency(amountPaise)} →
                        </motion.button>

                        {/* Locked notice - now under the button */}
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '0.25rem' }}>
                            The final interaction is locked until you send it
                        </p>

                        <button
                            onClick={() => navigate('/create/form')}
                            className="btn-ghost"
                            style={{ marginTop: '0.5rem' }}
                        >
                            ← Edit experience
                        </button>
                    </motion.div>


                </div>
            </div>
        </div>
    )
}

function PreviewPlaceholder({ experienceType, recipientName, senderName, onPlay }) {
    return (
        <div className="p-8">
            <div className="experience-card" style={{ maxWidth: '100%' }}>
                <div className="icon-circle icon-circle-lg mx-auto">
                    <span>{experienceType === 'CRUSH' ? '💕' : '👩‍❤️‍👨'}</span>
                </div>

                <h2 className="section-heading" style={{ fontSize: '2rem' }}>
                    Hey {recipientName}!
                </h2>

                <p
                    style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: '1rem',
                        color: 'var(--color-gray-600)',
                        margin: '0.5rem 0'
                    }}
                >
                    "{senderName ? `${senderName} has` : 'Someone has'} created something special just for you."
                </p>

                <p style={{ color: 'var(--color-primary)', fontWeight: 500, marginBottom: '1.5rem' }}>
                    {experienceType === 'CRUSH'
                        ? 'A secret admiration awaits ✨'
                        : 'A celebration of your love story together ✨'}
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onPlay}
                    style={{
                        padding: '0.875rem 2rem',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        background: 'transparent',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'var(--color-primary)';
                        e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = 'var(--color-primary)';
                    }}
                >
                    See Preview →
                </motion.button>

                <p className="sound-hint">Best experienced with sound on</p>
            </div>
        </div>
    )
}
