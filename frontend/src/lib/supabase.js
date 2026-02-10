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
    console.log(`[invokeFunction] Calling ${functionName} with:`, payload)

    const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
    })

    console.log(`[invokeFunction] ${functionName} response:`, { data, error })

    if (error) {
        console.error(`[invokeFunction] ${functionName} error:`, error)

        // FunctionsHttpError: the function returned a non-2xx status
        // The response body with the error details is in `data`, not `error`
        if (data && typeof data === 'object' && data.error) {
            throw new Error(data.error)
        }

        // Try to extract from error context
        if (error.context) {
            try {
                const body = await error.context.json()
                if (body?.error) throw new Error(body.error)
            } catch (_) {
                // context.json() may fail if already consumed
            }
        }

        throw new Error(error.message || 'Function invocation failed')
    }

    // Edge function returned 2xx but check if the data itself signals an error
    if (data && typeof data === 'object' && data.error && !data.success) {
        throw new Error(data.error)
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
