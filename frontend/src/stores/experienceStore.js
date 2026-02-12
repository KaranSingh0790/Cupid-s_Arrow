// Zustand store for experience creation flow
import { create } from 'zustand'
import { invokeFunction } from '../lib/supabase'

// Initial content templates
const INITIAL_CRUSH_CONTENT = {
    note: '', // Simple note to send to crush
}

const INITIAL_COUPLE_CONTENT = {
    // Memories timeline with photos
    memories: [
        { title: '', description: '', date: '', photo: null },
    ],
    appreciationMessage: '',
}

export const useExperienceStore = create((set, get) => ({
    // Experience type selection
    experienceType: null, // 'CRUSH' | 'COUPLE'

    // Form data
    senderName: '',
    senderEmail: '',
    recipientName: '',
    recipientEmail: '',
    content: {},

    // Created experience data
    experienceId: null,
    amountPaise: 0,

    // UI state
    isLoading: false,
    error: null,
    currentStep: 'select', // 'select' | 'form' | 'preview' | 'payment' | 'confirmation' | 'success'

    // Actions
    setExperienceType: (type) => {
        // Reset ALL form data when selecting a mode
        set({
            experienceType: type,
            senderName: '',
            senderEmail: '',
            recipientName: '',
            recipientEmail: '',
            content: type === 'CRUSH' ? { ...INITIAL_CRUSH_CONTENT } : { ...INITIAL_COUPLE_CONTENT },
            experienceId: null,
            amountPaise: 0,
            error: null,
            currentStep: 'form',
        })
    },

    setSenderName: (name) => set({ senderName: name }),
    setSenderEmail: (email) => set({ senderEmail: email }),
    setRecipientName: (name) => set({ recipientName: name }),
    setRecipientEmail: (email) => set({ recipientEmail: email }),

    // Update content for CRUSH mode
    setCrushNote: (note) => {
        const { content } = get()
        set({ content: { ...content, note } })
    },

    // Update content for COUPLE mode - Memories with photos
    updateMemory: (index, field, value) => {
        const { content } = get()
        const memories = [...(content.memories || [])]
        memories[index] = { ...memories[index], [field]: value }
        set({ content: { ...content, memories } })
    },

    updateMemoryPhoto: (index, photoUrl) => {
        const { content } = get()
        const memories = [...(content.memories || [])]
        memories[index] = { ...memories[index], photo: photoUrl }
        set({ content: { ...content, memories } })
    },

    addMemory: () => {
        const { content } = get()
        const memories = [...(content.memories || [])]
        if (memories.length < 6) {
            memories.push({ title: '', description: '', date: '', photo: null })
            set({ content: { ...content, memories } })
        }
    },

    removeMemory: (index) => {
        const { content } = get()
        const memories = [...(content.memories || [])]
        if (memories.length > 1) {
            memories.splice(index, 1)
            set({ content: { ...content, memories } })
        }
    },

    setAppreciationMessage: (message) => {
        const { content } = get()
        set({ content: { ...content, appreciationMessage: message } })
    },

    // Create experience via Edge Function
    createExperience: async () => {
        const { experienceType, senderName, senderEmail, recipientName, recipientEmail, content } = get()

        set({ isLoading: true, error: null })

        try {
            const response = await invokeFunction('createExperience', {
                experience_type: experienceType,
                sender_name: senderName || null,
                sender_email: senderEmail || null,
                recipient_name: recipientName,
                recipient_email: recipientEmail,
                content,
            })

            if (!response.success) {
                throw new Error(response.error || 'Failed to create experience')
            }

            set({
                experienceId: response.experience.id,
                amountPaise: response.experience.amount_paise,
                currentStep: 'preview',
                isLoading: false,
            })

            return response.experience
        } catch (error) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    // Navigation
    goToStep: (step) => set({ currentStep: step }),
    goBack: () => {
        const { currentStep } = get()
        const steps = ['select', 'form', 'preview', 'payment', 'confirmation', 'success']
        const currentIndex = steps.indexOf(currentStep)
        if (currentIndex > 0) {
            set({ currentStep: steps[currentIndex - 1] })
        }
    },

    // Reset store
    reset: () => set({
        experienceType: null,
        senderName: '',
        senderEmail: '',
        recipientName: '',
        recipientEmail: '',
        content: {},
        experienceId: null,
        amountPaise: 0,
        isLoading: false,
        error: null,
        currentStep: 'select',
    }),
}))
