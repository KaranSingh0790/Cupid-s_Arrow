// Couple Mode Experience Component
// Elegant design matching the reference screenshots
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartConfetti } from '../animations/Petals'
import { useRomanticMusic } from '../../hooks/useRomanticMusic'

const STAGES = {
    INTRO: 'intro',
    TIMELINE: 'timeline',
    APPRECIATION: 'appreciation',
    REAFFIRM: 'reaffirm',
    COMPLETE: 'complete',
}

export default function CoupleExperience({
    recipientName,
    senderName,
    content,
    isPreview = false,
    onResponse,
}) {
    const [stage, setStage] = useState(STAGES.INTRO)
    const [currentMemoryIndex, setCurrentMemoryIndex] = useState(0)
    const [showConfetti, setShowConfetti] = useState(false)
    const { fadeIn, fadeOut } = useRomanticMusic()

    // Fade out music when reaching complete stage
    useEffect(() => {
        if (stage === STAGES.COMPLETE) {
            fadeOut(1500)
        }
    }, [stage, fadeOut])

    const memories = content.memories?.filter(m => m?.title?.trim()) || []
    const appreciationMessage = content.appreciationMessage || ''

    const handleNext = () => {
        switch (stage) {
            case STAGES.INTRO:
                // Start romantic music when journey begins
                fadeIn(2000)
                setStage(memories.length > 0 ? STAGES.TIMELINE : STAGES.APPRECIATION)
                break
            case STAGES.TIMELINE:
                if (currentMemoryIndex < memories.length - 1) {
                    setCurrentMemoryIndex(prev => prev + 1)
                } else {
                    setStage(STAGES.APPRECIATION)
                }
                break
            case STAGES.APPRECIATION:
                setStage(STAGES.REAFFIRM)
                break
            default:
                break
        }
    }

    const handleReaffirm = () => {
        if (isPreview) return
        setShowConfetti(true)
        setStage(STAGES.COMPLETE)
        onResponse?.('REAFFIRMED')
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            <HeartConfetti isActive={showConfetti} />

            <AnimatePresence mode="wait">
                {/* Intro Stage */}
                {stage === STAGES.INTRO && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="experience-card"
                    >
                        <div className="icon-circle icon-circle-lg mx-auto">
                            <span>👩‍❤️‍👨</span>
                        </div>

                        <h1 className="section-heading" style={{ fontSize: '2.5rem' }}>
                            Hey {recipientName}!
                        </h1>

                        <p
                            style={{
                                fontFamily: 'var(--font-serif)',
                                fontStyle: 'italic',
                                fontSize: '1.125rem',
                                color: 'var(--color-gray-600)',
                                margin: '0.75rem 0'
                            }}
                        >
                            "{senderName ? `${senderName} has` : 'Someone special has'} created something special just for you."
                        </p>

                        <p style={{ color: 'var(--color-primary)', fontWeight: 500, marginBottom: '1.5rem' }}>
                            A celebration of your love story together ✨
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className="btn-primary"
                        >
                            Begin the Journey ❤️
                        </motion.button>

                        <p className="sound-hint">Best experienced with sound on</p>
                    </motion.div>
                )}

                {/* Timeline Stage */}
                {stage === STAGES.TIMELINE && memories.length > 0 && (
                    <motion.div
                        key={`memory-${currentMemoryIndex}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="experience-card experience-content-centered"
                    >
                        {/* Progress indicator */}
                        <div className="flex items-center gap-2 w-full justify-center">
                            {memories.map((_, idx) => (
                                <div
                                    key={idx}
                                    className="flex-1 h-1 rounded-full transition-colors"
                                    style={{
                                        maxWidth: '40px',
                                        background: idx <= currentMemoryIndex
                                            ? 'var(--color-primary)'
                                            : 'var(--color-gray-200)'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Memory photo */}
                        {memories[currentMemoryIndex]?.photo && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl overflow-hidden w-full"
                                style={{ maxWidth: '100%' }}
                            >
                                <img
                                    src={memories[currentMemoryIndex].photo}
                                    alt={memories[currentMemoryIndex].title || 'Memory'}
                                    style={{
                                        width: '100%',
                                        maxHeight: '280px',
                                        objectFit: 'cover',
                                        borderRadius: '0.75rem'
                                    }}
                                />
                            </motion.div>
                        )}

                        {!memories[currentMemoryIndex]?.photo && (
                            <div className="icon-circle mx-auto">
                                <span>📸</span>
                            </div>
                        )}

                        <div className="w-full flex flex-col items-center gap-2">
                            {/* Memory date */}
                            {memories[currentMemoryIndex]?.date && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}
                                >
                                    {memories[currentMemoryIndex].date}
                                </motion.p>
                            )}

                            {/* Memory title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="section-heading"
                                style={{ fontSize: '1.75rem', lineHeight: 1.2 }}
                            >
                                {memories[currentMemoryIndex]?.title}
                            </motion.h2>

                            {/* Memory description */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{
                                    color: 'var(--color-gray-600)',
                                    lineHeight: 1.6,
                                    marginTop: '0.5rem',
                                    fontFamily: 'var(--font-serif)',
                                    fontStyle: 'italic',
                                    fontSize: '1.125rem'
                                }}
                            >
                                "{memories[currentMemoryIndex]?.description}"
                            </motion.p>
                        </div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className="btn-primary"
                        >
                            {currentMemoryIndex < memories.length - 1 ? 'Next Memory 💕' : 'Continue →'}
                        </motion.button>
                    </motion.div>
                )}

                {/* Appreciation Stage */}
                {stage === STAGES.APPRECIATION && (
                    <motion.div
                        key="appreciation"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="experience-card experience-content-centered"
                    >
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="icon-circle icon-circle-lg mx-auto"
                        >
                            <span>💝</span>
                        </motion.div>

                        <h2 className="section-heading" style={{ fontSize: '2rem' }}>
                            From the Heart
                        </h2>

                        <div
                            className="rounded-xl p-8 w-full"
                            style={{ background: 'var(--color-rose-50)' }}
                        >
                            <p
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontStyle: 'italic',
                                    fontSize: '1.25rem',
                                    color: 'var(--color-gray-700)',
                                    lineHeight: 1.8,
                                    textAlign: 'center'
                                }}
                            >
                                "{appreciationMessage || `Thank you for being the most amazing part of my life. Every moment with you is a treasure I hold dear. You make my world brighter, my heart fuller, and my life complete. I love you more than words can express.`}"
                            </p>
                        </div>

                        <p style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                            — {senderName || 'Your Love'}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className="btn-primary"
                        >
                            Continue →
                        </motion.button>
                    </motion.div>
                )}

                {/* Reaffirmation Stage */}
                {stage === STAGES.REAFFIRM && (
                    <motion.div
                        key="reaffirm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="experience-card"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="icon-circle icon-circle-lg mx-auto"
                        >
                            <span>💕</span>
                        </motion.div>

                        <h2 className="section-heading" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
                            Our Journey Continues...
                        </h2>

                        <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem' }}>
                            Every day with you is a new chapter in our beautiful story.
                            Here's to many more memories together!
                        </p>

                        <motion.button
                            whileHover={{ scale: isPreview ? 1 : 1.02 }}
                            whileTap={{ scale: isPreview ? 1 : 0.98 }}
                            onClick={handleReaffirm}
                            disabled={isPreview}
                            className="btn-primary w-full"
                            style={{ opacity: isPreview ? 0.5 : 1 }}
                        >
                            I Love You Too! ❤️
                        </motion.button>

                        {isPreview && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '1rem' }}>
                                🔒 Interaction locked in preview
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Complete Stage */}
                {stage === STAGES.COMPLETE && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="experience-card"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="text-6xl mb-4"
                        >
                            💑✨💕
                        </motion.div>

                        <h2
                            className="section-heading"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            Forever & Always
                        </h2>

                        <p style={{ color: 'var(--color-gray-600)', margin: '0.5rem 0 1.5rem' }}>
                            Your love story continues to inspire.
                            Thank you for being each other's everything.
                        </p>


                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
