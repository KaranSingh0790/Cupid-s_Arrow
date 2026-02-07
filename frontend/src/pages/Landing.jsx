// Landing Page - Main entry point
// Elegant design matching reference screenshots - NO NAVBAR
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FloatingPetals } from '../components/animations/Petals'

export default function Landing() {
    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingPetals count={10} />

            {/* Hero Section */}
            <div className="page-container relative z-10" style={{ paddingTop: '0' }}>
                <div className="content-centered text-center px-4" style={{ minHeight: '100vh' }}>
                    {/* Hero content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="icon-circle icon-circle-lg mx-auto mb-6">
                            <span>💘</span>
                        </div>

                        <h1 className="section-heading" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            Send Love, Beautifully
                        </h1>

                        <p
                            style={{
                                fontFamily: 'var(--font-serif)',
                                fontStyle: 'italic',
                                fontSize: '1.25rem',
                                color: 'var(--color-gray-600)',
                                marginBottom: '0.75rem',
                                lineHeight: 1.6
                            }}
                        >
                            "Create unforgettable Valentine experiences for your crush or partner"
                        </p>

                        <p style={{ color: 'var(--color-primary)', fontWeight: 500, marginBottom: '2rem' }}>
                            Personalized messages, beautiful animations, and magical moments ✨
                        </p>

                        <Link to="/create">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn-primary"
                            >
                                Create Your Experience →
                            </motion.button>
                        </Link>

                        <p className="sound-hint">Join 10,000+ love stories told</p>
                    </motion.div>
                </div>





            </div>
        </div>
    )
}
