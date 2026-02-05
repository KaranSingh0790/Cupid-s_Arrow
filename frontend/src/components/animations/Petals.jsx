// Floating petals animation component
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Generate random petal properties
function generatePetal(id) {
    return {
        id,
        left: Math.random() * 100,
        size: 10 + Math.random() * 15,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 5,
        rotation: Math.random() * 360,
    }
}

export function FloatingPetals({ count = 15 }) {
    const [petals, setPetals] = useState([])

    useEffect(() => {
        const initialPetals = Array.from({ length: count }, (_, i) => generatePetal(i))
        setPetals(initialPetals)
    }, [count])

    return (
        <div className="petal-container">
            {petals.map((petal) => (
                <motion.div
                    key={petal.id}
                    className="petal"
                    style={{
                        left: `${petal.left}%`,
                        width: petal.size,
                        height: petal.size,
                    }}
                    initial={{ y: '-10vh', rotate: 0, opacity: 0 }}
                    animate={{
                        y: '110vh',
                        rotate: petal.rotation,
                        opacity: [0, 0.7, 0.7, 0],
                    }}
                    transition={{
                        duration: petal.duration,
                        delay: petal.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            ))}
        </div>
    )
}

// Heart confetti burst animation
export function HeartConfetti({ isActive }) {
    const hearts = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: -200 - Math.random() * 200,
        rotation: Math.random() * 720 - 360,
        scale: 0.5 + Math.random() * 0.5,
    }))

    if (!isActive) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            {hearts.map((heart) => (
                <motion.div
                    key={heart.id}
                    className="absolute text-4xl"
                    initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                    animate={{
                        x: heart.x,
                        y: heart.y,
                        scale: heart.scale,
                        rotate: heart.rotation,
                        opacity: 0,
                    }}
                    transition={{
                        duration: 1.5,
                        ease: 'easeOut',
                    }}
                >
                    💕
                </motion.div>
            ))}
        </div>
    )
}

// Gentle floating hearts background
export function FloatingHearts({ count = 8 }) {
    const hearts = Array.from({ length: count }, (_, i) => ({
        id: i,
        left: 10 + (i * 80) / count + Math.random() * 10,
        delay: i * 0.5,
        duration: 4 + Math.random() * 2,
        size: 16 + Math.random() * 16,
    }))

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {hearts.map((heart) => (
                <motion.div
                    key={heart.id}
                    className="absolute"
                    style={{
                        left: `${heart.left}%`,
                        fontSize: heart.size,
                        bottom: '-50px',
                    }}
                    animate={{
                        y: [0, -window.innerHeight - 100],
                        opacity: [0, 0.4, 0.4, 0],
                        rotate: [-10, 10, -10],
                    }}
                    transition={{
                        duration: heart.duration,
                        delay: heart.delay,
                        repeat: Infinity,
                        ease: 'linear',
                        rotate: {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        },
                    }}
                >
                    🤍
                </motion.div>
            ))}
        </div>
    )
}
