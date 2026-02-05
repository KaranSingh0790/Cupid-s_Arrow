// Landing Page - Hero section with CTA
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FloatingPetals, FloatingHearts } from '../components/animations/Petals'

export default function Landing() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background animations */}
            <FloatingPetals count={12} />
            <FloatingHearts count={6} />

            {/* Main content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
                {/* Logo/Brand */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-6xl mb-6"
                >
                    💘
                </motion.div>

                {/* Main heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-6xl font-bold text-center mb-4"
                    style={{
                        background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    Cupid's Arrow
                </motion.h1>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-gray-600 text-center max-w-md mb-8 px-4"
                >
                    Create a beautiful, emotional experience for someone special.
                    Express your feelings like never before.
                </motion.p>

                {/* Decorative line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-24 h-1 rounded-full mb-10"
                    style={{ background: 'linear-gradient(90deg, #fda4af, #fb7185, #fda4af)' }}
                />

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <Link to="/create">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary text-lg"
                        >
                            Create Your Experience
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Sub-text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-6 text-sm text-gray-500"
                >
                    Starting at just ₹49 • No account needed
                </motion.p>

                {/* Feature highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl px-4"
                >
                    <FeatureCard
                        emoji="💕"
                        title="Crush Mode"
                        description="Secret admirer confession with playful interaction"
                    />
                    <FeatureCard
                        emoji="💑"
                        title="Couple Mode"
                        description="Celebrate your journey with a memory timeline"
                    />
                    <FeatureCard
                        emoji="✉️"
                        title="Instant Delivery"
                        description="Beautiful email sent directly to your special someone"
                    />
                </motion.div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-400">
                Made with 💖 in India
            </div>
        </div>
    )
}

function FeatureCard({ emoji, title, description }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-6 text-center"
        >
            <div className="text-3xl mb-3">{emoji}</div>
            <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </motion.div>
    )
}
