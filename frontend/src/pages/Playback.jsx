// Playback Page - The actual experience recipient sees (/v/:id)
// Elegant immersive experience design
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getExperience, supabase } from '../lib/supabase'
import { FloatingPetals } from '../components/animations/Petals'
import CrushExperience from '../components/experience/CrushExperience'
import CoupleExperience from '../components/experience/CoupleExperience'

export default function Playback() {
    const { id } = useParams()
    const [experience, setExperience] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (id) {
            loadExperience()
        }
    }, [id])

    const loadExperience = async () => {
        try {
            setLoading(true)
            const data = await getExperience(id)
            setExperience(data)

            // Record OPENED event if not already opened
            if (data.lifecycle_state === 'SENT') {
                try {
                    await supabase
                        .from('experiences')
                        .update({
                            lifecycle_state: 'OPENED',
                            opened_at: new Date().toISOString()
                        })
                        .eq('id', id)
                } catch (err) {
                    console.error('Failed to update opened state:', err)
                }
            }
        } catch (err) {
            console.error('Failed to load experience:', err)
            setError('This experience could not be found or has expired.')
        } finally {
            setLoading(false)
        }
    }

    const handleResponse = async (response) => {
        try {
            await supabase
                .from('experiences')
                .update({
                    lifecycle_state: 'RESPONDED',
                    responded_at: new Date().toISOString(),
                    response: response,
                })
                .eq('id', id)
        } catch (err) {
            console.error('Failed to record response:', err)
        }
    }

    if (loading) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center"
                style={{ background: 'var(--bg-main)' }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-4xl mb-4"
                >
                    💕
                </motion.div>
                <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                    Loading your experience...
                </p>
            </div>
        )
    }

    if (error || !experience) {
        return (
            <div
                className="min-h-screen flex items-center justify-center px-4"
                style={{ background: 'var(--bg-main)' }}
            >
                <div className="experience-card">
                    <div className="icon-circle icon-circle-lg mx-auto">
                        <span>💔</span>
                    </div>
                    <h1 className="section-heading" style={{ fontSize: '1.75rem' }}>
                        Experience Not Found
                    </h1>
                    <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem' }}>
                        {error || 'This link may have expired or is invalid.'}
                    </p>
                    <Link to="/">
                        <button className="btn-secondary">
                            Go to Home
                        </button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-main)' }}>
            <FloatingPetals count={12} />

            <div className="relative z-10 min-h-screen pt-8 pb-16 px-4">
                <div className="max-w-md mx-auto">
                    {experience.experience_type === 'CRUSH' ? (
                        <CrushExperience
                            recipientName={experience.recipient_name}
                            senderName={experience.sender_name}
                            content={experience.content}
                            isPreview={false}
                            onResponse={handleResponse}
                        />
                    ) : (
                        <CoupleExperience
                            recipientName={experience.recipient_name}
                            senderName={experience.sender_name}
                            content={experience.content}
                            isPreview={false}
                            onResponse={handleResponse}
                        />
                    )}
                </div>
            </div>


        </div>
    )
}
