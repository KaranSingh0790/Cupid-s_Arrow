// Mode Selector Page - Choose between Crush and Couple mode
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
import { FloatingPetals } from '../components/animations/Petals'

export default function ModeSelector() {
    const navigate = useNavigate()
    const setExperienceType = useExperienceStore((state) => state.setExperienceType)

    const handleSelectMode = (mode) => {
        setExperienceType(mode)
        navigate('/create/form')
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <FloatingPetals count={10} />

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                        Choose Your Experience
                    </h1>
                    <p className="text-gray-600">
                        What kind of message would you like to send?
                    </p>
                </motion.div>

                {/* Mode cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full px-4">
                    {/* Crush Mode Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectMode('CRUSH')}
                        className="glass-card p-8 cursor-pointer group"
                    >
                        <div className="text-5xl mb-4 group-hover:animate-heartbeat">💕</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Crush Mode</h2>
                        <p className="text-gray-600 mb-4">
                            A secret admiration reveal with a playful Valentine proposal.
                            Perfect for confessing your feelings.
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-rose-500">₹49</span>
                            <span className="text-sm text-gray-400">One-time</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                ✨ Name reveal • 💌 Sweet messages • 💘 Yes/No interaction
                            </p>
                        </div>
                    </motion.div>

                    {/* Couple Mode Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectMode('COUPLE')}
                        className="glass-card p-8 cursor-pointer group"
                    >
                        <div className="text-5xl mb-4 group-hover:animate-heartbeat">💑</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Couple Mode</h2>
                        <p className="text-gray-600 mb-4">
                            A beautiful timeline of your memories together with a heartfelt
                            appreciation message.
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-rose-500">₹99</span>
                            <span className="text-sm text-gray-400">One-time</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                📸 Memory timeline • 💝 Appreciation • ❤️ Reaffirmation
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Back link */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => navigate('/')}
                    className="mt-10 text-gray-500 hover:text-gray-700 text-sm"
                >
                    ← Back to home
                </motion.button>
            </div>
        </div>
    )
}
