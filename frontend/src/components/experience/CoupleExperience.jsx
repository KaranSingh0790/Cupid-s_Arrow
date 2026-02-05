// Couple Mode Experience Component
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartConfetti } from '../animations/Petals'

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

    const memories = content.memories?.filter(m => m?.title?.trim()) || []
    const appreciationMessage = content.appreciationMessage || ''

    const handleNext = () => {
        switch (stage) {
            case STAGES.INTRO:
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
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
            <HeartConfetti isActive={showConfetti} />

            <AnimatePresence mode="wait">
                {/* Intro Stage */}
                {stage === STAGES.INTRO && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center glass-card p-10"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl mb-6"
                        >
                            💑
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Hey {recipientName}!
                        </h1>
                        <p className="text-gray-600 mb-2">
                            {senderName ? `${senderName} has` : 'Someone special has'} created
                        </p>
                        <p className="text-rose-500 font-semibold mb-6">
                            A celebration of your love story together 💖
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            className="btn-primary"
                        >
                            Begin the Journey ✨
                        </motion.button>
                    </motion.div>
                )}

                {/* Timeline Stage */}
                {stage === STAGES.TIMELINE && memories.length > 0 && (
                    <motion.div
                        key={`memory-${currentMemoryIndex}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="glass-card p-8 max-w-md w-full"
                    >
                        {/* Progress indicator */}
                        <div className="flex items-center gap-2 mb-6">
                            {memories.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 h-1 rounded-full transition-colors ${idx <= currentMemoryIndex ? 'bg-rose-500' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="text-center">
                            <div className="text-4xl mb-4">📸</div>

                            {/* Memory date */}
                            {memories[currentMemoryIndex]?.date && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-rose-400 mb-2"
                                >
                                    {memories[currentMemoryIndex].date}
                                </motion.p>
                            )}

                            {/* Memory title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl font-bold text-gray-800 mb-4"
                            >
                                {memories[currentMemoryIndex]?.title}
                            </motion.h2>

                            {/* Memory description */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-gray-600 leading-relaxed mb-6"
                            >
                                {memories[currentMemoryIndex]?.description}
                            </motion.p>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                className="btn-primary"
                            >
                                {currentMemoryIndex < memories.length - 1 ? 'Next Memory 💕' : 'Continue →'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Appreciation Stage */}
                {stage === STAGES.APPRECIATION && (
                    <motion.div
                        key="appreciation"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center glass-card p-10 max-w-md"
                    >
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-5xl mb-6"
                        >
                            💝
                        </motion.div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            From the Heart
                        </h2>
                        <div className="bg-rose-50/50 rounded-xl p-6 mb-6">
                            <p className="text-gray-700 leading-relaxed italic">
                                "{appreciationMessage || `Thank you for being the most amazing part of my life. Every moment with you is a treasure I hold dear. You make my world brighter, my heart fuller, and my life complete. I love you more than words can express.`}"
                            </p>
                        </div>
                        <p className="text-rose-500 font-medium mb-6">
                            — {senderName || 'Your Love'}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            className="btn-primary"
                        >
                            Continue 💖
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
                        className="text-center glass-card p-10 max-w-md"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-6xl mb-6"
                        >
                            💕
                        </motion.div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Our Journey Continues...
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Every day with you is a new chapter in our beautiful story.
                            Here's to many more memories together!
                        </p>

                        <motion.button
                            whileHover={{ scale: isPreview ? 1 : 1.05 }}
                            whileTap={{ scale: isPreview ? 1 : 0.95 }}
                            onClick={handleReaffirm}
                            disabled={isPreview}
                            className={`btn-primary w-full text-lg py-4 ${isPreview ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            I Love You Too! ❤️
                        </motion.button>

                        {isPreview && (
                            <p className="text-sm text-gray-400 mt-4">
                                🔒 Interaction locked in preview
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Complete Stage */}
                {stage === STAGES.COMPLETE && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center glass-card p-10 max-w-md"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="text-6xl mb-6"
                        >
                            💑✨💕
                        </motion.div>
                        <h2 className="text-3xl font-bold text-rose-500 mb-4">
                            Forever & Always
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Your love story continues to inspire.
                            Thank you for being each other's everything.
                        </p>
                        <div className="bg-rose-50/50 rounded-xl p-4 text-rose-400 text-sm">
                            💕 Made with love on Cupid's Arrow
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
