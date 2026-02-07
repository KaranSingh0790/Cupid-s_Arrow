// Mode Selector - Choose between Crush and Couple mode
// Clean design with proper spacing and details
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
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
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingPetals count={6} />

            <div className="page-container relative z-10 flex items-center justify-center" style={{ minHeight: '100vh', padding: '3rem 1rem' }}>
                <div className="w-full" style={{ maxWidth: '480px' }}>
                    {/* Progress Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="progress-container"
                    >
                        <div className="progress-bar-wrapper">
                            <span className="progress-step-text">Step 1 of 4</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '25%' }}></div>
                            </div>
                            <span className="progress-label">Choose Mode</span>
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                        style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}
                    >
                        <h1 className="section-heading" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
                            Who's it for?
                        </h1>
                        <p className="section-subheading" style={{ marginBottom: '0' }}>
                            Choose how you want to express your feelings
                        </p>
                    </motion.div>

                    {/* Mode Selection Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Crush Option */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectMode('CRUSH')}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                paddingRight: '1.5rem',
                                borderRadius: '1rem',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                background: 'white',
                                border: '1px solid var(--color-gray-100)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                            }}
                        >
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #FFF5F5 0%, #FFE4E8 100%)'
                                }}
                            >
                                <span style={{ fontSize: '1.75rem' }}>💕</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{
                                    fontSize: '1.0625rem',
                                    fontWeight: 600,
                                    color: 'var(--color-gray-900)',
                                    marginBottom: '0.25rem'
                                }}>
                                    Your Crush
                                </h3>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-gray-500)',
                                    lineHeight: 1.4,
                                    margin: 0
                                }}>
                                    Send a secret admiration or reveal yourself with a playful proposal
                                </p>
                            </div>
                            <div style={{
                                flexShrink: 0,
                                color: 'var(--color-primary)',
                                fontSize: '1.25rem',
                                marginLeft: '0.5rem'
                            }}>
                                →
                            </div>
                        </motion.button>

                        {/* Partner Option */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectMode('COUPLE')}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                paddingRight: '1.5rem',
                                borderRadius: '1rem',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                background: 'white',
                                border: '1px solid var(--color-gray-100)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                            }}
                        >
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #FFF0F3 0%, #FFE0E6 100%)'
                                }}
                            >
                                <span style={{ fontSize: '1.75rem' }}>💑</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{
                                    fontSize: '1.0625rem',
                                    fontWeight: 600,
                                    color: 'var(--color-gray-900)',
                                    marginBottom: '0.25rem'
                                }}>
                                    Your Partner
                                </h3>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-gray-500)',
                                    lineHeight: 1.4,
                                    margin: 0
                                }}>
                                    Create a timeline of memories and make their valentines special
                                </p>
                            </div>
                            <div style={{
                                flexShrink: 0,
                                color: 'var(--color-primary)',
                                fontSize: '1.25rem',
                                marginLeft: '0.5rem'
                            }}>
                                →
                            </div>
                        </motion.button>
                    </div>

                    {/* Back button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ marginTop: '2.5rem', textAlign: 'center' }}
                    >
                        <Link to="/" className="btn-ghost">
                            ← Back to Previous
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
