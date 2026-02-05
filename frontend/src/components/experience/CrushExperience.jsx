// Crush Mode Experience Component
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartConfetti } from '../animations/Petals'

const STAGES = {
    INTRO: 'intro',
    NAME_REVEAL: 'name_reveal',
    MESSAGES: 'messages',
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
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
    const [noAttempts, setNoAttempts] = useState(0)
    const [finalResponse, setFinalResponse] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const noButtonRef = useRef(null)

    const messages = content.admirationMessages?.filter(m => m?.trim()) || []
    const customMessage = content.customMessage || ''
    const maxNoAttempts = 4

    const handleStageProgress = () => {
        switch (stage) {
            case STAGES.INTRO:
                setStage(senderName ? STAGES.NAME_REVEAL : STAGES.MESSAGES)
                break
            case STAGES.NAME_REVEAL:
                setStage(STAGES.MESSAGES)
                break
            case STAGES.MESSAGES:
                if (currentMessageIndex < messages.length - 1) {
                    setCurrentMessageIndex(prev => prev + 1)
                } else {
                    setStage(STAGES.PROPOSAL)
                }
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

    const handleNo = () => {
        if (isPreview) return

        if (noAttempts >= maxNoAttempts - 1) {
            setFinalResponse('GRACEFUL_EXIT')
            setStage(STAGES.RESPONSE)
            onResponse?.('GRACEFUL_EXIT')
            return
        }

        // Move the button randomly
        setNoAttempts(prev => prev + 1)
        if (noButtonRef.current) {
            const container = noButtonRef.current.parentElement
            if (container) {
                const maxX = container.offsetWidth - noButtonRef.current.offsetWidth - 20
                const maxY = 100
                const newX = Math.random() * maxX
                const newY = -20 - Math.random() * maxY
                noButtonRef.current.style.transform = `translate(${newX}px, ${newY}px)`
            }
        }
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
            <HeartConfetti isActive={showConfetti} />

            <AnimatePresence mode="wait">
                {/* Intro Stage */}
                {stage === STAGES.INTRO && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center glass-card p-10"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl mb-6"
                        >
                            💕
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-3">
                            Hey {recipientName}!
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Someone has something special to tell you...
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStageProgress}
                            className="btn-primary"
                        >
                            See What It Is 💌
                        </motion.button>
                    </motion.div>
                )}

                {/* Name Reveal Stage */}
                {stage === STAGES.NAME_REVEAL && (
                    <motion.div
                        key="name"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="text-center glass-card p-10"
                    >
                        <p className="text-gray-500 mb-4">This message is from...</p>
                        <motion.h2
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            className="text-4xl font-bold text-rose-500 mb-6"
                        >
                            {senderName} 💖
                        </motion.h2>
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStageProgress}
                            className="btn-primary"
                        >
                            Continue →
                        </motion.button>
                    </motion.div>
                )}

                {/* Messages Stage */}
                {stage === STAGES.MESSAGES && messages.length > 0 && (
                    <motion.div
                        key={`message-${currentMessageIndex}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="text-center glass-card p-10 max-w-md"
                    >
                        <div className="text-4xl mb-4">💭</div>
                        <motion.p
                            className="text-xl text-gray-700 leading-relaxed mb-6 italic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            "{messages[currentMessageIndex]}"
                        </motion.p>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {messages.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-colors ${idx <= currentMessageIndex ? 'bg-rose-500' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStageProgress}
                            className="btn-primary"
                        >
                            {currentMessageIndex < messages.length - 1 ? 'Next 💕' : 'Continue →'}
                        </motion.button>
                    </motion.div>
                )}

                {/* Proposal Stage */}
                {stage === STAGES.PROPOSAL && (
                    <motion.div
                        key="proposal"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center glass-card p-10 max-w-md"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            className="text-6xl mb-6"
                        >
                            💘
                        </motion.div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Will you be my Valentine?
                        </h2>
                        {customMessage && (
                            <p className="text-gray-600 mb-6 italic">
                                "{customMessage}"
                            </p>
                        )}

                        <div className="relative min-h-[100px] flex flex-col items-center gap-4">
                            <motion.button
                                whileHover={{ scale: isPreview ? 1 : 1.05 }}
                                whileTap={{ scale: isPreview ? 1 : 0.95 }}
                                onClick={handleYes}
                                disabled={isPreview}
                                className={`btn-primary px-12 ${isPreview ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Yes! 💖
                            </motion.button>

                            <motion.button
                                ref={noButtonRef}
                                onClick={handleNo}
                                disabled={isPreview}
                                className={`btn-secondary px-8 transition-transform duration-300 ${isPreview ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                style={{ position: 'relative' }}
                            >
                                No 😔
                            </motion.button>

                            {isPreview && (
                                <p className="text-sm text-gray-400 mt-4">
                                    🔒 Interaction locked in preview
                                </p>
                            )}

                            {noAttempts > 0 && noAttempts < maxNoAttempts && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-rose-400 mt-2"
                                >
                                    Are you sure? 🥺
                                </motion.p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Response Stage */}
                {stage === STAGES.RESPONSE && (
                    <motion.div
                        key="response"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center glass-card p-10 max-w-md"
                    >
                        {finalResponse === 'YES' ? (
                            <>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.5, repeat: 3 }}
                                    className="text-6xl mb-6"
                                >
                                    🎉💕🎉
                                </motion.div>
                                <h2 className="text-3xl font-bold text-rose-500 mb-4">
                                    Yay!!!
                                </h2>
                                <p className="text-gray-600">
                                    This is the beginning of something beautiful!
                                    {senderName && ` ${senderName} will be so happy! 💖`}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-6">💔</div>
                                <h2 className="text-2xl font-bold text-gray-700 mb-4">
                                    It's Okay...
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Not every story is meant to be. Thank you for your honesty.
                                    {senderName ? ` ${senderName} appreciates you taking the time.` : ''}
                                    Wishing you all the best! 🌸
                                </p>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
