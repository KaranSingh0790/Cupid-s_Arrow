// Experience Builder Form - Create your experience
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'

export default function ExperienceBuilder() {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validationError, setValidationError] = useState(null)

    const {
        experienceType,
        senderName,
        recipientName,
        recipientEmail,
        content,
        setSenderName,
        setRecipientName,
        setRecipientEmail,
        updateAdmirationMessage,
        addAdmirationMessage,
        setCustomMessage,
        updateMemory,
        addMemory,
        removeMemory,
        setAppreciationMessage,
        createExperience,
        error,
    } = useExperienceStore()

    // Redirect if no type selected
    if (!experienceType) {
        navigate('/create')
        return null
    }

    const validateForm = () => {
        if (!recipientName.trim()) {
            setValidationError('Please enter their name')
            return false
        }
        if (!recipientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
            setValidationError('Please enter a valid email address')
            return false
        }

        if (experienceType === 'CRUSH') {
            const validMessages = content.admirationMessages?.filter(m => m.trim().length > 0)
            if (!validMessages || validMessages.length < 1) {
                setValidationError('Please add at least one admiration message')
                return false
            }
        } else {
            const validMemories = content.memories?.filter(m => m.title.trim() && m.description.trim())
            if (!validMemories || validMemories.length < 1) {
                setValidationError('Please add at least one memory with title and description')
                return false
            }
        }

        setValidationError(null)
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            await createExperience()
            navigate('/create/preview')
        } catch (err) {
            console.error('Failed to create experience:', err)
        }
        setIsSubmitting(false)
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="text-4xl mb-3">
                        {experienceType === 'CRUSH' ? '💕' : '💑'}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {experienceType === 'CRUSH' ? 'Create Your Confession' : 'Create Your Love Story'}
                    </h1>
                    <p className="text-gray-600">
                        Fill in the details to craft a beautiful experience
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="glass-card p-8"
                >
                    {/* Error display */}
                    <AnimatePresence>
                        {(validationError || error) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                            >
                                {validationError || error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Basic Info Section */}
                    <div className="space-y-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <span>👤</span> Basic Information
                        </h2>

                        {/* Sender Name (optional for Crush) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Your Name {experienceType === 'CRUSH' && '(optional - for surprise reveal)'}
                            </label>
                            <input
                                type="text"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder={experienceType === 'CRUSH' ? 'Leave empty for anonymous' : 'Your name'}
                                className="input-romantic"
                            />
                        </div>

                        {/* Recipient Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Their Name *
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="Who is this for?"
                                className="input-romantic"
                                required
                            />
                        </div>

                        {/* Recipient Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Their Email *
                            </label>
                            <input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="their.email@example.com"
                                className="input-romantic"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                The experience link will be sent to this email
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-8" />

                    {/* Content Section - Crush Mode */}
                    {experienceType === 'CRUSH' && (
                        <CrushModeFields
                            content={content}
                            updateAdmirationMessage={updateAdmirationMessage}
                            addAdmirationMessage={addAdmirationMessage}
                            setCustomMessage={setCustomMessage}
                        />
                    )}

                    {/* Content Section - Couple Mode */}
                    {experienceType === 'COUPLE' && (
                        <CoupleModeFields
                            content={content}
                            updateMemory={updateMemory}
                            addMemory={addMemory}
                            removeMemory={removeMemory}
                            setAppreciationMessage={setAppreciationMessage}
                        />
                    )}

                    {/* Submit Button */}
                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/create')}
                            className="btn-secondary flex-1"
                        >
                            ← Back
                        </button>
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            className="btn-primary flex-1 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <LoadingSpinner /> Creating...
                                </span>
                            ) : (
                                'Preview Experience →'
                            )}
                        </motion.button>
                    </div>
                </motion.form>
            </div>
        </div>
    )
}

// Crush Mode specific fields
function CrushModeFields({ content, updateAdmirationMessage, addAdmirationMessage, setCustomMessage }) {
    const messages = content.admirationMessages || ['', '', '']

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span>💌</span> Admiration Messages
            </h2>
            <p className="text-sm text-gray-500 -mt-4">
                These sweet messages will be revealed one by one
            </p>

            {messages.map((message, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Message {index + 1} {index === 0 && '*'}
                    </label>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => updateAdmirationMessage(index, e.target.value)}
                        placeholder={getAdmirationPlaceholder(index)}
                        className="input-romantic"
                    />
                </motion.div>
            ))}

            {messages.length < 5 && (
                <button
                    type="button"
                    onClick={addAdmirationMessage}
                    className="text-rose-500 text-sm hover:text-rose-600 flex items-center gap-1"
                >
                    <span>+</span> Add another message
                </button>
            )}

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                    Custom Valentine Message
                </label>
                <textarea
                    value={content.customMessage || ''}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal message that will appear with the Valentine proposal..."
                    className="textarea-romantic"
                    rows={3}
                />
            </div>
        </div>
    )
}

// Couple Mode specific fields
function CoupleModeFields({ content, updateMemory, addMemory, removeMemory, setAppreciationMessage }) {
    const memories = content.memories || [{ title: '', description: '', date: '' }]

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span>📸</span> Your Memories Together
            </h2>
            <p className="text-sm text-gray-500 -mt-4">
                Create a timeline of your special moments
            </p>

            {memories.map((memory, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-rose-50/50 rounded-xl space-y-4"
                >
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-rose-500">Memory {index + 1}</span>
                        {memories.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeMemory(index)}
                                className="text-gray-400 hover:text-red-500 text-sm"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <input
                        type="text"
                        value={memory.title}
                        onChange={(e) => updateMemory(index, 'title', e.target.value)}
                        placeholder="Memory title (e.g., 'Our First Date')"
                        className="input-romantic"
                    />

                    <textarea
                        value={memory.description}
                        onChange={(e) => updateMemory(index, 'description', e.target.value)}
                        placeholder="Describe this special moment..."
                        className="textarea-romantic"
                        rows={2}
                    />

                    <input
                        type="text"
                        value={memory.date}
                        onChange={(e) => updateMemory(index, 'date', e.target.value)}
                        placeholder="Date (optional, e.g., 'January 2024')"
                        className="input-romantic"
                    />
                </motion.div>
            ))}

            {memories.length < 6 && (
                <button
                    type="button"
                    onClick={addMemory}
                    className="text-rose-500 text-sm hover:text-rose-600 flex items-center gap-1"
                >
                    <span>+</span> Add another memory
                </button>
            )}

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                    Appreciation Message
                </label>
                <textarea
                    value={content.appreciationMessage || ''}
                    onChange={(e) => setAppreciationMessage(e.target.value)}
                    placeholder="Write a heartfelt message expressing your love and appreciation..."
                    className="textarea-romantic"
                    rows={4}
                />
            </div>
        </div>
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

function getAdmirationPlaceholder(index) {
    const placeholders = [
        "I love the way you smile...",
        "Your kindness always amazes me...",
        "Every moment with you feels special...",
        "You make my world brighter...",
        "I can't stop thinking about you...",
    ]
    return placeholders[index] || "Add your message..."
}
