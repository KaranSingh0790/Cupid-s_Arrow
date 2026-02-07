// Custom hook for romantic background music
import { useRef, useEffect, useCallback, useState } from 'react'

// Use local audio file (must be placed in public/audio folder)
// To add music:
// 1. Download a romantic MP3 file
// 2. Place it in frontend/public/audio/romantic.mp3
// 3. The app will automatically use it

const LOCAL_AUDIO_PATH = '/audio/romantic.mp3'

export function useRomanticMusic() {
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Create audio element on mount
        const audio = new Audio()
        audio.loop = true
        audio.volume = 0.25 // Soft background volume
        audio.preload = 'auto'

        // Set up event handlers
        audio.oncanplaythrough = () => {
            console.log('✓ Audio loaded successfully from:', LOCAL_AUDIO_PATH)
            setIsLoaded(true)
            setError(null)
        }

        audio.onerror = () => {
            console.log('ℹ No audio file found at', LOCAL_AUDIO_PATH)
            console.log('  To add music: place an MP3 file at frontend/public/audio/romantic.mp3')
            setError('No audio file')
            setIsLoaded(false)
        }

        // Load local audio file
        audio.src = LOCAL_AUDIO_PATH
        audioRef.current = audio

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
                audioRef.current = null
            }
        }
    }, [])

    const play = useCallback(() => {
        if (audioRef.current && !isPlaying && isLoaded) {
            const playPromise = audioRef.current.play()
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('♪ Audio playing')
                        setIsPlaying(true)
                    })
                    .catch((err) => {
                        console.log('Audio blocked - user interaction required')
                    })
            }
        }
    }, [isPlaying, isLoaded])

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }, [])

    const setVolume = useCallback((volume) => {
        if (audioRef.current) {
            audioRef.current.volume = Math.max(0, Math.min(1, volume))
        }
    }, [])

    const fadeIn = useCallback((duration = 2000) => {
        if (!audioRef.current || !isLoaded) {
            // Silently skip if no audio - don't break the experience
            return
        }

        audioRef.current.volume = 0

        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('♪ Music fade in started')
                    setIsPlaying(true)

                    const steps = 20
                    const targetVolume = 0.25
                    const increment = targetVolume / steps
                    let currentStep = 0

                    const fadeInterval = setInterval(() => {
                        currentStep++
                        if (audioRef.current) {
                            audioRef.current.volume = Math.min(targetVolume, currentStep * increment)
                        }
                        if (currentStep >= steps) {
                            clearInterval(fadeInterval)
                        }
                    }, duration / steps)
                })
                .catch(() => {
                    // Silently fail - music is optional
                })
        }
    }, [isLoaded])

    const fadeOut = useCallback((duration = 1000) => {
        if (audioRef.current && isPlaying) {
            const startVolume = audioRef.current.volume
            const steps = 20
            const decrement = startVolume / steps
            let currentStep = 0

            const fadeInterval = setInterval(() => {
                currentStep++
                if (audioRef.current) {
                    audioRef.current.volume = Math.max(0, startVolume - (currentStep * decrement))
                }
                if (currentStep >= steps) {
                    clearInterval(fadeInterval)
                    if (audioRef.current) {
                        audioRef.current.pause()
                        audioRef.current.volume = 0.25
                    }
                    setIsPlaying(false)
                }
            }, duration / steps)
        }
    }, [isPlaying])

    return {
        play,
        pause,
        fadeIn,
        fadeOut,
        setVolume,
        isPlaying,
        isLoaded,
        error,
    }
}
