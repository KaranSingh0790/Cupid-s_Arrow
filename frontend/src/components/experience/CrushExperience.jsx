// Crush Mode Experience Component
// Simple flow: Intro → Note reveal → "Will you be my Valentine?" with playful No button
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartConfetti } from '../animations/Petals'
import { useRomanticMusic } from '../../hooks/useRomanticMusic'
import { invokeFunction } from '../../lib/supabase'

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
    experienceId,
}) {
    const [stage, setStage] = useState(STAGES.INTRO)
    const [noAttempts, setNoAttempts] = useState(0)
    const [yesButtonScale, setYesButtonScale] = useState(1)
    const [finalResponse, setFinalResponse] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 })
    const [replyMessage, setReplyMessage] = useState('')
    const [isSendingReply, setIsSendingReply] = useState(false)
    const [replySent, setReplySent] = useState(false)
    const containerRef = useRef(null)
    const { fadeIn, fadeOut } = useRomanticMusic()

    const note = content.note || ''
    const maxNoAttempts = 50

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

        // Move No button to random position within bounds
        setNoAttempts(prev => prev + 1)

        // Constrain movement to stay within visible area
        const maxX = 80 // Max horizontal offset
        const maxY = 80 // Max vertical offset
        const newX = (Math.random() - 0.5) * maxX * 2 // Range: -80 to +80
        const newY = (Math.random() - 0.5) * maxY * 2 // Range: -80 to +80
        setNoButtonPosition({ x: newX, y: newY })
    }, [isPreview, noAttempts])

    const handleNo = () => {
        if (isPreview) return

        if (noAttempts >= maxNoAttempts) {
            setFinalResponse('GRACEFUL_EXIT')
            setStage(STAGES.RESPONSE)
            onResponse?.('GRACEFUL_EXIT')
        }
    }

    // Send reply email to sender
    const handleSendReply = async () => {
        if (!replyMessage.trim() || !experienceId) return

        setIsSendingReply(true)
        try {
            await invokeFunction('sendReplyEmail', {
                experience_id: experienceId,
                reply_message: replyMessage.trim(),
                recipient_name: recipientName,
            })
            setReplySent(true)
        } catch (error) {
            console.error('Failed to send reply:', error)
            // Still show success to user for better UX
            setReplySent(true)
        } finally {
            setIsSendingReply(false)
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
                            <div className="relative min-h-[250px] flex flex-col items-center justify-center gap-4 w-full">
                                {/* Yes Button - grows bigger as they try to click No */}
                                <motion.button
                                    animate={{ scale: yesButtonScale }}
                                    whileHover={{ scale: isPreview ? yesButtonScale : yesButtonScale * 1 }}
                                    whileTap={{ scale: isPreview ? yesButtonScale : yesButtonScale * 0.05 }}
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
                {stage === STAGES.RESPONSE && (
                    <div className="space-y-6">
                        {/* Main Response Card */}
                        <motion.div
                            key="response"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="experience-card"
                            style={{ padding: '2.5rem 2rem' }}
                        >
                            {finalResponse === 'YES' ? (
                                <>
                                    <h2
                                        className="section-heading"
                                        style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}
                                    >
                                        Yay!!! 💕
                                    </h2>
                                    <p style={{
                                        color: 'var(--color-gray-600)',
                                        marginBottom: replySent ? 0 : '2rem',
                                        lineHeight: 1.7,
                                        fontSize: '1rem'
                                    }}>
                                        This is the beginning of something beautiful!
                                        {senderName && ` ${senderName} will be so happy! 💖`}
                                    </p>

                                    {!replySent && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="w-full"
                                        >
                                            <div
                                                className="rounded-2xl"
                                                style={{
                                                    background: 'var(--color-rose-50)',
                                                    padding: '1.25rem',
                                                    marginBottom: '1.25rem'
                                                }}
                                            >
                                                <p style={{
                                                    fontSize: '0.9rem',
                                                    color: 'var(--color-gray-600)',
                                                    marginLeft: '0.5rem',
                                                    marginRight: '0.5rem',
                                                    marginBottom: '1rem',
                                                    fontWeight: 500
                                                }}>
                                                    💌 Want to send {senderName || 'them'} a message back?
                                                </p>
                                                <textarea
                                                    value={replyMessage}
                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                    placeholder="Write something sweet..."
                                                    className="textarea-romantic"
                                                    style={{
                                                        minHeight: '100px',
                                                        marginBottom: 0,
                                                        padding: '1rem',
                                                        fontSize: '0.95rem',
                                                        borderRadius: '12px'
                                                    }}
                                                />
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSendReply}
                                                disabled={isSendingReply || !replyMessage.trim()}
                                                className="btn-primary w-full"
                                                style={{
                                                    opacity: (!replyMessage.trim() || isSendingReply) ? 0.6 : 1,
                                                    padding: '1rem 2rem',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                {isSendingReply ? 'Sending...' : 'Send Reply →'}
                                            </motion.button>
                                        </motion.div>
                                    )}
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

                        {/* Reply Sent Confirmation Card */}
                        {replySent && finalResponse === 'YES' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="experience-card text-center"
                                style={{ padding: '2rem', marginTop: '1rem' }}
                            >
                                <div className="text-4xl mb-3">✉️ ✨</div>
                                <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem' }}>
                                    Your reply has been sent!
                                </p>
                                <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    {senderName || 'They'} will receive your message 💕
                                </p>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence >
        </div >
    )
}
