// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    )
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)

// Helper to invoke Edge Functions
export async function invokeFunction(functionName, payload) {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
    })

    if (error) {
        throw new Error(error.message || 'Function invocation failed')
    }

    return data
}

// Fetch experience by ID (public read)
export async function getExperience(id) {
    const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(error.message || 'Experience not found')
    }

    return data
}

// Record analytics event
export async function recordEvent(experienceId, eventType, metadata = {}) {
    try {
        await invokeFunction('recordEvent', {
            experience_id: experienceId,
            event_type: eventType,
            metadata,
        })
    } catch (err) {
        // Non-blocking - don't fail the experience for analytics
        console.error('Failed to record event:', err)
    }
}
