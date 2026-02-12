// Payment Confirmation — Post-payment form (no webhooks)
// Collects transaction details, stores in Supabase for admin verification
// Email is NOT sent automatically — admin must verify payment first
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../stores/experienceStore'
import { invokeFunction, supabase } from '../lib/supabase'
import { FloatingPetals } from '../components/animations/Petals'
import { isIndiaUser, getOrderRef } from '../lib/paymentUtils'

export default function PaymentConfirmation() {
    const navigate = useNavigate()
    const {
        experienceId,
        experienceType,
        senderName,
        senderEmail,
        recipientName,
        recipientEmail,
        content,
        goToStep,
    } = useExperienceStore()

    const [form, setForm] = useState({
        name: senderName || '',
        email: senderEmail || '',
        paymentMethod: isIndiaUser() ? 'upi' : 'paypal',
        transactionId: '',
        screenshotFile: null,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)

    // Guard
    useEffect(() => {
        if (!experienceId) {
            navigate('/create')
        }
    }, [experienceId, navigate])

    if (!experienceId) return null

    const updateField = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    // ── Build message content summary ──
    const messageSummary =
        experienceType === 'CRUSH'
            ? content?.note || '(Crush message)'
            : content?.appreciationMessage || '(Couple appreciation)'

    // ── Submit confirmation ──
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.email.trim()) {
            setError('Please enter your name and email')
            return
        }
        if (!form.transactionId.trim() || form.transactionId.trim().length < 6) {
            setError('Please enter a valid Transaction / Reference ID (at least 6 characters)')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // 1. Upload screenshot if provided
            let screenshotUrl = null
            if (form.screenshotFile) {
                const fileExt = form.screenshotFile.name.split('.').pop()
                const filePath = `payment-proofs/${experienceId}_${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('payment-screenshots')
                    .upload(filePath, form.screenshotFile, { upsert: true })

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('payment-screenshots')
                        .getPublicUrl(filePath)
                    screenshotUrl = urlData?.publicUrl || null
                }
            }

            // 2. Store confirmation in Supabase + send admin notification
            await invokeFunction('confirmManualPayment', {
                experience_id: experienceId,
                name: form.name.trim(),
                email: form.email.trim(),
                payment_method: form.paymentMethod,
                transaction_id: form.transactionId.trim(),
                screenshot_url: screenshotUrl,
                message_content: messageSummary,
                order_ref: getOrderRef(experienceId),
            })

            // NOTE: We do NOT call sendEmail here.
            // The admin must verify the transaction ID first.
            // Only after admin verification will the email be sent.

            // Go to success (with "being verified" messaging)
            goToStep('success')
            navigate('/create/success')
        } catch (err) {
            console.error('Confirmation submission failed:', err)
            setError(
                err.message || 'Something went wrong. Please try again or contact support.'
            )
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ background: 'var(--bg-main)' }}
        >
            <FloatingPetals count={5} />

            <div
                className="page-container relative z-10 flex items-center justify-center"
                style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}
            >
                <div className="w-full max-w-md px-6">
                    {/* Progress Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="progress-container"
                    >
                        <div className="progress-bar-wrapper">
                            <span className="progress-step-text">Step 5 of 5</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '100%' }} />
                            </div>
                            <span className="progress-label">Confirm</span>
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                        style={{ marginBottom: '1.5rem' }}
                    >
                        <div className="icon-circle icon-circle-lg mx-auto mb-4">
                            <span>✅</span>
                        </div>
                        <h1 className="section-heading" style={{ fontSize: '2rem' }}>
                            Confirm Your Payment
                        </h1>
                        <p
                            style={{
                                color: 'var(--color-gray-500)',
                                fontSize: '0.9rem',
                                marginTop: '0.5rem',
                            }}
                        >
                            Almost done! Just fill in your payment details to activate
                            delivery.
                        </p>
                    </motion.div>

                    {/* Form Card */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onSubmit={handleSubmit}
                        className="glass-card"
                        style={{ padding: '1.75rem' }}
                    >
                        {/* Name */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Your Name *</label>
                            <input
                                type="text"
                                className="input-romantic"
                                placeholder="Your full name"
                                value={form.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                required
                                id="confirm-name"
                            />
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Your Email *</label>
                            <input
                                type="email"
                                className="input-romantic"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                required
                                id="confirm-email"
                            />
                        </div>

                        {/* Payment Method */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Payment Method *</label>
                            <div className="flex gap-3">
                                <label
                                    className="flex-1"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        background:
                                            form.paymentMethod === 'upi'
                                                ? 'var(--color-rose-50)'
                                                : 'var(--color-gray-50)',
                                        border:
                                            form.paymentMethod === 'upi'
                                                ? '2px solid var(--color-primary)'
                                                : '2px solid transparent',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="upi"
                                        checked={form.paymentMethod === 'upi'}
                                        onChange={() => updateField('paymentMethod', 'upi')}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{ fontSize: '1.25rem' }}>📱</span>
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            fontSize: '0.875rem',
                                            color: 'var(--color-gray-700)',
                                        }}
                                    >
                                        UPI
                                    </span>
                                </label>

                                <label
                                    className="flex-1"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        background:
                                            form.paymentMethod === 'paypal'
                                                ? 'var(--color-rose-50)'
                                                : 'var(--color-gray-50)',
                                        border:
                                            form.paymentMethod === 'paypal'
                                                ? '2px solid var(--color-primary)'
                                                : '2px solid transparent',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="paypal"
                                        checked={form.paymentMethod === 'paypal'}
                                        onChange={() => updateField('paymentMethod', 'paypal')}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{ fontSize: '1.25rem' }}>🌐</span>
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            fontSize: '0.875rem',
                                            color: 'var(--color-gray-700)',
                                        }}
                                    >
                                        PayPal
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Transaction ID */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">
                                Transaction / Reference ID *
                            </label>
                            <input
                                type="text"
                                className="input-romantic"
                                placeholder={
                                    form.paymentMethod === 'upi'
                                        ? 'e.g. UPI Ref: 123456789012'
                                        : 'e.g. PayPal Transaction ID'
                                }
                                value={form.transactionId}
                                onChange={(e) => updateField('transactionId', e.target.value)}
                                required
                                id="confirm-txn-id"
                            />
                            <p className="form-hint">
                                Find this in your {form.paymentMethod === 'upi' ? 'UPI app' : 'PayPal'}{' '}
                                payment receipt
                            </p>
                        </div>

                        {/* Screenshot upload (optional) */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">
                                Payment Screenshot{' '}
                                <span style={{ color: 'var(--color-gray-400)', fontWeight: 400 }}>
                                    (optional)
                                </span>
                            </label>
                            <div
                                style={{
                                    position: 'relative',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-gray-50)',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        updateField('screenshotFile', e.target.files?.[0] || null)
                                    }
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        cursor: 'pointer',
                                    }}
                                    id="confirm-screenshot"
                                />
                                {form.screenshotFile ? (
                                    <span
                                        style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--color-gray-700)',
                                        }}
                                    >
                                        📎 {form.screenshotFile.name}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--color-gray-400)',
                                        }}
                                    >
                                        📷 Tap to upload screenshot
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Valentine message preview */}
                        <div
                            style={{
                                marginBottom: '1.25rem',
                                padding: '0.875rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-rose-50)',
                                border: '1px solid var(--color-rose-200)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: 'var(--color-primary)',
                                    marginBottom: '0.375rem',
                                }}
                            >
                                💌 Message for {recipientName}
                            </div>
                            <p
                                style={{
                                    fontSize: '0.8125rem',
                                    color: 'var(--color-gray-600)',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '80px',
                                    overflow: 'hidden',
                                }}
                            >
                                {messageSummary}
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    marginBottom: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: '#FEF2F2',
                                    color: '#991B1B',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            disabled={isSubmitting}
                            className="btn-primary w-full"
                            id="submit-confirmation"
                            style={{ marginBottom: '0.75rem' }}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <LoadingSpinner />
                                    Verifying...
                                </span>
                            ) : (
                                <>Submit & Confirm ❤️</>
                            )}
                        </motion.button>

                        {/* Trust footer */}
                        <p
                            style={{
                                textAlign: 'center',
                                fontSize: '0.7rem',
                                color: 'var(--color-gray-400)',
                                lineHeight: 1.5,
                            }}
                        >
                            Your payment will be verified and your valentine
                            will be delivered within minutes. 🔒
                        </p>
                    </motion.form>

                    {/* Back */}
                    <div className="text-center" style={{ marginTop: '1rem' }}>
                        <button
                            onClick={() => navigate('/create/payment')}
                            className="btn-ghost"
                        >
                            ← Back to payment
                        </button>
                    </div>
                </div>
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
