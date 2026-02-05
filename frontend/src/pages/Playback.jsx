// Playback Page - The actual experience recipient sees (/v/:id)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-4xl"
                >
                    💕
                </motion.div>
            </div>
        )
    }

    if (error || !experience) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="glass-card p-8 max-w-md text-center">
                    <div className="text-5xl mb-4">💔</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Experience Not Found
                    </h1>
                    <p className="text-gray-600">
                        {error || 'This link may have expired or is invalid.'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <FloatingPetals count={15} />

            <div className="relative z-10 min-h-screen py-8 px-4">
                <div className="max-w-xl mx-auto">
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
