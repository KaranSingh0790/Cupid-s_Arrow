// Crush Mode Experience Component
// Simple flow: Intro → Note reveal → "Will you be my Valentine?" with playful No button
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartConfetti } from '../animations/Petals'
import { useRomanticMusic } from '../../hooks/useRomanticMusic'

const STAGES = {
    INTRO: 'intro',
    NOTE: 'note',
    PROPOSAL: 'proposal',
    RESPONSE: 'response',
}

export default function CrushExperience({
    recipientName,
    senderName,
    content,
    isPreview = false,
    onResponse,
}) {
    const [stage, setStage] = useState(STAGES.INTRO)
    const [noAttempts, setNoAttempts] = useState(0)
    const [yesButtonScale, setYesButtonScale] = useState(1)
    const [finalResponse, setFinalResponse] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)
    const { fadeIn, fadeOut } = useRomanticMusic()

    const note = content.note || ''
    const maxNoAttempts = 5

    // Fade out music when reaching response stage
    useEffect(() => {
        if (stage === STAGES.RESPONSE) {
            fadeOut(1500)
        }
    }, [stage, fadeOut])

    const handleStageProgress = () => {
        switch (stage) {
            case STAGES.INTRO:
                // Start romantic music when journey begins
                fadeIn(2000)
                setStage(STAGES.NOTE)
                break
            case STAGES.NOTE:
                setStage(STAGES.PROPOSAL)
                break
            default:
                break
        }
    }

    const handleYes = () => {
        if (isPreview) return
        setShowConfetti(true)
        setFinalResponse('YES')
        setStage(STAGES.RESPONSE)
        onResponse?.('YES')
    }

    // Move No button away from cursor on hover
    const handleNoHover = useCallback(() => {
        if (isPreview) return

        if (noAttempts >= maxNoAttempts - 1) {
            return // Let them click it after max attempts
        }

        // Increase Yes button size
        setYesButtonScale(prev => Math.min(prev + 0.15, 2))

        // Move No button to random position
        setNoAttempts(prev => prev + 1)

        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect()
            const maxX = containerRect.width - 100 // button width approximation
            const maxY = 150
            const newX = (Math.random() - 0.5) * maxX
            const newY = -(Math.random() * maxY + 50)
            setNoButtonPosition({ x: newX, y: newY })
        }
    }, [isPreview, noAttempts])

    const handleNo = () => {
        if (isPreview) return

        if (noAttempts >= maxNoAttempts) {
            setFinalResponse('GRACEFUL_EXIT')
            setStage(STAGES.RESPONSE)
            onResponse?.('GRACEFUL_EXIT')
        }
    }

    const getPlayfulMessage = () => {
        const messages = [
            "Are you sure? 🥺",
            "The button seems shy! 💕",
            "It keeps running away! 😅",
            "Maybe it's a sign? 🌟",
            "One more try? 💖"
        ]
        return messages[Math.min(noAttempts, messages.length - 1)]
    }

    return (
        <div className={`flex flex-col items-center justify-center px-4 ${isPreview ? 'min-h-[60vh] py-8' : 'min-h-[80vh]'}`}>
            <HeartConfetti isActive={showConfetti} />

            <AnimatePresence mode="wait">
                {/* Intro Stage */}
                {stage === STAGES.INTRO && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="experience-card"
                    >
                        <div className="icon-circle icon-circle-lg mx-auto">
                            <span>💌</span>
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
                            "{senderName ? `${senderName} has` : 'Someone special has'} a message for you..."
                        </p>

                        <p style={{ color: 'var(--color-primary)', fontWeight: 500, marginBottom: '1.5rem' }}>
                            Something from the heart awaits ✨
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStageProgress}
                            className="btn-primary"
                        >
                            Open the Message ❤️
                        </motion.button>

                        <p className="sound-hint">Best experienced with sound on</p>
                    </motion.div>
                )}

                {/* Note Reveal Stage */}
                {stage === STAGES.NOTE && (
                    <motion.div
                        key="note"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="experience-card"
                    >
                        <div className="icon-circle mx-auto mb-6">
                            <span>💭</span>
                        </div>

                        {senderName && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    color: 'var(--color-primary)',
                                    fontWeight: 600,
                                    marginBottom: '1.5rem'
                                }}
                            >
                                A note from {senderName} 💕
                            </motion.p>
                        )}

                        <motion.div
                            className="rounded-xl p-10 my-8"
                            style={{
                                background: 'var(--color-rose-50)',
                                border: '1px solid var(--color-primary)',
                                borderColor: 'rgba(236, 72, 153, 0.2)',
                                boxShadow: '0 4px 20px rgba(251, 113, 133, 0.15)'
                            }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <p
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontStyle: 'italic',
                                    fontSize: '1.35rem',
                                    color: 'var(--color-gray-700)',
                                    lineHeight: 1.8,
                                    textAlign: 'center'
                                }}
                            >
                                "{note || 'You make my heart skip a beat every time I see you. I\'ve been wanting to tell you this for so long... 💕'}"
                            </p>
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStageProgress}
                            className="btn-primary"
                            style={{ marginTop: '1rem', padding: '1rem 3rem' }}
                        >
                            Continue →
                        </motion.button>
                    </motion.div>
                )}

                {/* Proposal Stage - The Main Event! */}
                {stage === STAGES.PROPOSAL && (
                    <motion.div
                        key="proposal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="experience-card"
                        ref={containerRef}
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            className="icon-circle icon-circle-lg mx-auto"
                        >
                            <span>💘</span>
                        </motion.div>

                        <h2 className="section-heading" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                            Will you be my Valentine?
                        </h2>

                        {senderName && (
                            <p style={{ color: 'var(--color-gray-500)', marginBottom: '1.5rem' }}>
                                — {senderName}
                            </p>
                        )}

                        <div className="flex flex-col items-center w-full">
                            <div className="relative min-h-[300px] flex flex-row items-center justify-center gap-8 w-full">
                                {/* Yes Button - grows bigger as they try to click No */}
                                <motion.button
                                    animate={{ scale: yesButtonScale }}
                                    whileHover={{ scale: isPreview ? yesButtonScale : yesButtonScale * 1.05 }}
                                    whileTap={{ scale: isPreview ? yesButtonScale : yesButtonScale * 0.98 }}
                                    onClick={handleYes}
                                    disabled={isPreview}
                                    className="btn-primary"
                                    style={{
                                        opacity: isPreview ? 0.5 : 1,
                                        fontSize: `${1.25 + (yesButtonScale - 1) * 0.3}rem`,
                                        padding: '1.5rem 4rem',
                                        fontWeight: 700
                                    }}
                                >
                                    YES
                                </motion.button>

                                {/* No Button - runs away on hover/tap! */}
                                <motion.button
                                    animate={{
                                        x: noButtonPosition.x,
                                        y: noButtonPosition.y,
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    onHoverStart={handleNoHover}
                                    onClick={handleNoHover}
                                    disabled={isPreview}
                                    className="btn-secondary"
                                    style={{
                                        opacity: isPreview ? 0.5 : 1,
                                        cursor: isPreview ? 'not-allowed' : 'pointer',
                                        padding: '1rem 2.5rem',
                                        fontSize: '1rem'
                                    }}
                                >
                                    No
                                </motion.button>
                            </div>

                            <div className="flex flex-col items-center gap-2 pb-4">
                                {isPreview && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                                        🔒 Interaction locked in preview
                                    </p>
                                )}

                                {noAttempts > 0 && noAttempts < maxNoAttempts && (
                                    <motion.p
                                        key={noAttempts}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            color: 'var(--color-primary)',
                                            fontWeight: 500,
                                            minHeight: '1.5rem'
                                        }}
                                    >
                                        {getPlayfulMessage()}
                                    </motion.p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Response Stage */}
                {
                    stage === STAGES.RESPONSE && (
                        <motion.div
                            key="response"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="experience-card"
                        >
                            {finalResponse === 'YES' ? (
                                <>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 0.5, repeat: 3 }}
                                        className="text-6xl mb-4"
                                    >
                                        🎉💕🎉
                                    </motion.div>
                                    <h2
                                        className="section-heading"
                                        style={{ color: 'var(--color-primary)' }}
                                    >
                                        Yay!!!
                                    </h2>
                                    <p style={{ color: 'var(--color-gray-600)', marginTop: '0.5rem', lineHeight: 1.6 }}>
                                        This is the beginning of something beautiful!
                                        {senderName && ` ${senderName} will be so happy! 💖`}
                                    </p>

                                </>
                            ) : (
                                <>
                                    <div className="text-5xl mb-4">💔</div>
                                    <h2
                                        className="section-heading"
                                        style={{ fontSize: '1.75rem', color: 'var(--color-gray-700)' }}
                                    >
                                        It's Okay...
                                    </h2>
                                    <p style={{ color: 'var(--color-gray-600)', lineHeight: 1.6, marginTop: '0.5rem' }}>
                                        Not every story is meant to be. Thank you for your honesty.
                                        {senderName ? ` ${senderName} appreciates you taking the time.` : ''}
                                        {' '}Wishing you all the best! 🌸
                                    </p>
                                </>
                            )}
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    )
}
