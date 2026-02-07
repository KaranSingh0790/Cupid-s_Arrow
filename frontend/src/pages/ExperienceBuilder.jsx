// Experience Builder - Form page for creating the experience
// Elegant design matching reference screenshots
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
import { FloatingPetals } from '../components/animations/Petals'

export default function ExperienceBuilder() {
    const navigate = useNavigate()
    const {
        experienceType,
        setRecipientName,
        setRecipientEmail,
        setSenderName,
        content,
        recipientName,
        recipientEmail,
        senderName,
        createExperience,
        setCrushNote,
        updateMemory,
        updateMemoryPhoto,
        addMemory,
        removeMemory,
        setAppreciationMessage,
    } = useExperienceStore()

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!experienceType) {
            navigate('/create')
        }
    }, [experienceType, navigate])

    if (!experienceType) return null

    const validateForm = () => {
        const newErrors = {}

        if (!recipientName?.trim()) {
            newErrors.recipientName = 'Their name is required'
        }

        if (!recipientEmail?.trim()) {
            newErrors.recipientEmail = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
            newErrors.recipientEmail = 'Please enter a valid email'
        }

        if (experienceType === 'CRUSH') {
        } else {
            const memories = content.memories?.filter(m => m?.title?.trim()) || []
            const messages = content.admirationMessages?.filter(m => m?.trim()) || []
            if (memories.length === 0 && messages.length === 0) {
                newErrors.memories = 'Please add at least one memory or love message'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            await createExperience()
            navigate('/create/preview')
        } catch (error) {
            console.error('Failed to create experience:', error)
            setErrors({ submit: error.message || 'Failed to create experience' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingPetals count={8} />

            <div className="page-container relative z-10 flex items-center justify-center" style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
                <div className="w-full" style={{ maxWidth: '480px', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="progress-container"
                    >
                        <div className="progress-bar-wrapper">
                            <span className="progress-step-text">Step 2 of 4</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '50%' }}></div>
                            </div>
                            <span className="progress-label">{experienceType === 'CRUSH' ? 'Crush Mode' : 'Couple Mode'}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-8"
                    >
                        <div className="icon-circle mx-auto mb-4">
                            <span>{experienceType === 'CRUSH' ? '❤️' : '💝'}</span>
                        </div>
                        <h1 className="section-heading">Craft Your Romantic Message</h1>
                        <p style={{ marginBottom: '2rem' }}>
                            Share the magic that makes your bond unique
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="form-section text-left">
                            <div className="form-section-header" style={{ justifyContent: 'flex-start' }}>
                            </div>

                            <div className="space-y-5 mt-5">
                                <div>
                                    <label className="form-label">Your Name (optional)</label>
                                    <input
                                        type="text"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="input-romantic"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">
                                        Their Name <span style={{ color: 'var(--color-primary)' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        placeholder="Enter their name"
                                        className="input-romantic"
                                    />
                                    {errors.recipientName && (
                                        <p style={{ color: 'var(--color-primary)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                                            {errors.recipientName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="form-label">
                                        Their Email <span style={{ color: 'var(--color-primary)' }}>*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        placeholder="username@gmail.com"
                                        className="input-romantic"
                                    />
                                    <p className="text-pink-500 text-xs">The experience link will be sent to this email privately</p>
                                    {errors.recipientEmail && (
                                        <p style={{ color: 'var(--color-primary)', fontSize: '0.7125rem', marginTop: '0.5rem' }}>
                                            {errors.recipientEmail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {experienceType === 'CRUSH' ? (
                            <CrushModeFields
                                content={content}
                                setCrushNote={setCrushNote}
                                error={errors.note}
                            />
                        ) : (
                            <CoupleModeFields
                                content={content}
                                updateMemory={updateMemory}
                                updateMemoryPhoto={updateMemoryPhoto}
                                addMemory={addMemory}
                                removeMemory={removeMemory}
                                setAppreciationMessage={setAppreciationMessage}
                                error={errors.memories}
                            />
                        )}
                    </motion.div>

                    <AnimatePresence>
                        {errors.submit && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 p-4 rounded-xl text-center"
                                style={{
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {errors.submit}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                    >
                        <motion.button
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="btn-primary"
                            style={{ maxWidth: '280px', width: '100%' }}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <LoadingSpinner />
                                    Creating...
                                </span>
                            ) : (
                                <>Preview Experience →</>
                            )}
                        </motion.button>

                        <Link to="/create" className="btn-ghost">
                            ← Back to Previous
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

function CrushModeFields({ content, setCrushNote, error }) {
    return (
        <div className="form-section text-left">
            <div className="form-section-header" style={{ justifyContent: 'flex-start' }}>
                <span className="form-section-icon">💌</span>
                <span className="form-section-title">Your Love Note</span>
            </div>
            <p className="form-section-subtitle" style={{ textAlign: 'left', marginTop: '0.25rem' }}>
                Write a heartfelt message that will be revealed to your crush
            </p>

            <div className="mt-5">
                <textarea
                    value={content.note || ''}
                    onChange={(e) => setCrushNote(e.target.value)}
                    placeholder="Write something from your heart... Tell them how you feel, what you admire about them, or simply express your feelings..."
                    className="textarea-romantic"
                    rows={6}
                    style={{ resize: 'none' }}
                />

                {error && (
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                        {error}
                    </p>
                )}
            </div>
        </div>
    )
}

function CoupleModeFields({ content, updateMemory, updateMemoryPhoto, addMemory, removeMemory, setAppreciationMessage, error }) {
    const memories = content.memories && content.memories.length > 0
        ? content.memories
        : [{ title: '', date: '', description: '', photo: null }]

    const handlePhotoChange = (index, event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                updateMemoryPhoto(index, reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const removePhoto = (index) => {
        updateMemoryPhoto(index, null)
    }

    return (
        <>
            {/* Memories Timeline Section */}
            <div className="form-section text-left">
                <div className="form-section-header" style={{ justifyContent: 'flex-start' }}>
                    <span className="form-section-icon">📸</span>
                    <span className="form-section-title">Your Journey Together</span>
                </div>
                <p className="form-section-subtitle" style={{ textAlign: 'left', marginTop: '0.25rem' }}>
                    Share special moments with photos from your relationship
                </p>

                <div className="space-y-6 mt-5">
                    {memories.map((memory, index) => (
                        <div
                            key={index}
                            className="rounded-2xl relative"
                            style={{
                                padding: '1rem',
                                background: 'var(--color-gray-50)',
                                border: '1px solid var(--color-gray-100)'
                            }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className="form-section-label" style={{ marginBottom: 0 }}>Memory {index + 1}</span>
                                {memories.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMemory(index)}
                                        style={{
                                            color: 'var(--color-gray-400)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                                {/* Photo Upload Area */}
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Photo</label>
                                    <div
                                        className="relative rounded-xl overflow-hidden"
                                        style={{
                                            background: 'white',
                                            border: '2px dashed var(--color-gray-200)',
                                            minHeight: memory.photo ? '200px' : '100px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {memory.photo ? (
                                            <div className="relative w-full">
                                                <img
                                                    src={memory.photo}
                                                    alt={`Photo for memory ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '200px',
                                                        objectFit: 'cover',
                                                        borderRadius: '0.75rem'
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(index)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '28px',
                                                        height: '28px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4"
                                                style={{ minHeight: '100px' }}
                                            >
                                                <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷</span>
                                                <span style={{
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--color-gray-500)',
                                                    textAlign: 'center'
                                                }}>
                                                    Add a photo of this moment
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handlePhotoChange(index, e)}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Title</label>
                                    <input
                                        type="text"
                                        value={memory.title || ''}
                                        onChange={(e) => updateMemory(index, 'title', e.target.value)}
                                        placeholder="Our first date..."
                                        className="input-romantic"
                                        style={{ background: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Date (optional)</label>
                                    <input
                                        type="text"
                                        value={memory.date || ''}
                                        onChange={(e) => updateMemory(index, 'date', e.target.value)}
                                        placeholder="February 14, 2024"
                                        className="input-romantic"
                                        style={{ background: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Description</label>
                                    <textarea
                                        value={memory.description || ''}
                                        onChange={(e) => updateMemory(index, 'description', e.target.value)}
                                        placeholder="Share what made this moment special..."
                                        className="textarea-romantic"
                                        style={{ background: 'white' }}
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {memories.length < 6 && (
                        <div style={{ paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={addMemory}
                                className="btn-ghost"
                                style={{ padding: 0 }}
                            >
                                <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>⊕</span> Add another memory
                            </button>
                        </div>
                    )}

                    {error && (
                        <p style={{ color: 'var(--color-primary)', fontSize: '0.8125rem' }}>
                            {error}
                        </p>
                    )}
                </div>
            </div>

            {/* Appreciation Message */}
            <div className="form-section text-left">
                <label className="form-label">Final Appreciation Message</label>
                <textarea
                    value={content.appreciationMessage || ''}
                    onChange={(e) => setAppreciationMessage(e.target.value)}
                    placeholder="Express your deepest love and appreciation..."
                    className="textarea-romantic"
                    rows={4}
                />
            </div>
        </>
    )
}

function LoadingSpinner() {
    return (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    )
}
