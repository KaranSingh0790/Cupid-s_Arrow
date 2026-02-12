// Payment Page — UPI (India) + PayPal (International)
// HDFC-safe minimal deep link + fallback options for failed payments
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useExperienceStore } from '../stores/experienceStore'
import { FloatingPetals } from '../components/animations/Petals'
import {
    UPI_ID,
    isIndiaUser,
    isMobileDevice,
    getPrice,
    formatPrice,
    getUPIDeepLink,
    getUPIQRData,
    getPayPalLink,
    getPaymentDisplayInfo,
} from '../lib/paymentUtils'

export default function Payment() {
    const navigate = useNavigate()
    const [isIndia, setIsIndia] = useState(isIndiaUser)
    const isMobile = isMobileDevice()
    const [copied, setCopied] = useState(false)

    const {
        experienceId,
        experienceType,
        recipientName,
        recipientEmail,
        goToStep,
    } = useExperienceStore()

    useEffect(() => {
        if (!experienceId) navigate('/create')
    }, [experienceId, navigate])

    if (!experienceId) return null

    const price = getPrice(experienceType, isIndia)
    const displayPrice = formatPrice(experienceType, isIndia)
    const gatewayInfo = getPaymentDisplayInfo(isIndia)

    // Minimal UPI deep link (HDFC-safe: pa, pn, am, cu only)
    const upiDeepLink = useMemo(() => getUPIDeepLink(price), [price])
    const qrData = useMemo(() => getUPIQRData(price), [price])

    // ── Mobile: open UPI app ──
    const handleUPIPayment = () => {
        window.location.href = upiDeepLink
        setTimeout(() => {
            goToStep('confirmation')
            navigate('/create/confirm')
        }, 2000)
    }

    // ── International: PayPal ──
    const handlePayPalPayment = () => {
        window.open(getPayPalLink(price), '_blank')
        setTimeout(() => {
            goToStep('confirmation')
            navigate('/create/confirm')
        }, 1000)
    }

    // ── Copy UPI ID ──
    const handleCopyUPI = useCallback(() => {
        navigator.clipboard.writeText(UPI_ID).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = UPI_ID
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }, [])

    const toggleRegion = () => setIsIndia((prev) => !prev)

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ background: 'var(--bg-main)' }}
        >
            <FloatingPetals count={6} />

            <div
                className="page-container relative z-10 flex items-center justify-center"
                style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}
            >
                <div className="w-full max-w-sm px-8">
                    {/* Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="progress-container"
                    >
                        <div className="progress-bar-wrapper">
                            <span className="progress-step-text">Step 4 of 5</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '80%' }} />
                            </div>
                            <span className="progress-label">Payment</span>
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-20"
                    >
                        <div className="icon-circle icon-circle-lg mx-auto mb-4">
                            <span>💝</span>
                        </div>
                        <h1 className="section-heading">Complete Your Order</h1>
                        <p style={{ marginBottom: '2.5rem' }}>
                            Send your personalized experience to{' '}
                            <strong style={{ color: 'var(--color-gray-700)' }}>
                                {recipientName}
                            </strong>
                        </p>
                    </motion.div>

                    {/* Order Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="order-summary"
                        style={{ marginBottom: '0.5rem' }}
                    >
                        <div className="order-summary-label">Order Summary</div>
                        <div className="order-item">
                            <div className="order-item-info">
                                <span className="order-item-icon">
                                    {experienceType === 'CRUSH' ? '💕' : '👩‍❤️‍👨'}
                                </span>
                                <div>
                                    <div className="order-item-name">
                                        {experienceType === 'CRUSH' ? 'Crush Mode' : 'Couple Mode'}
                                    </div>
                                    <div className="order-item-description">
                                        Personalized timeline & messages
                                    </div>
                                </div>
                            </div>
                            <span className="order-item-price">{displayPrice}</span>
                        </div>
                        <div className="order-recipient">
                            <span>Recipient</span>
                            <span>{recipientEmail}</span>
                        </div>
                        <div className="order-total">
                            <span className="order-total-label">Total</span>
                            <span className="order-total-price">{displayPrice}</span>
                        </div>
                    </motion.div>

                    {/* ═══════════════════════════════════════ */}
                    {/* PAYMENT METHODS CARD                    */}
                    {/* ═══════════════════════════════════════ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="glass-card p-6 text-center"
                        style={{ marginBottom: '0.5rem' }}
                    >
                        {/* Payment icons */}
                        <div className="payment-methods">
                            <div className="payment-methods-label">Pay Securely With</div>
                            <div className="payment-icons">
                                {gatewayInfo.methods.map((method, index) => (
                                    <div className="payment-icon" key={index}>
                                        <span>{method.icon}</span>
                                        <span>{method.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── INDIA: UPI ── */}
                        {isIndia && (
                            <>
                                {isMobile ? (
                                    /* ── MOBILE: Deep link button ── */
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleUPIPayment}
                                            className="btn-primary w-2/3"
                                            id="pay-upi-button"
                                        >
                                            Pay {displayPrice} via UPI →
                                        </motion.button>

                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--color-gray-500)',
                                                lineHeight: 1.5,
                                                marginTop: '0.5rem',
                                                textAlign: 'center',
                                            }}
                                        >
                                            You'll be redirected to Google Pay with the amount already filled.
                                            <br />
                                            Complete the payment and return here ❤️
                                        </p>
                                    </div>
                                ) : (
                                    /* ── DESKTOP: QR Code ── */
                                    <div className="flex flex-col items-center gap-3">
                                        <p
                                            style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-gray-600)',
                                                marginBottom: '0.5rem',
                                            }}
                                        >
                                            Scan with any UPI app to pay{' '}
                                            <strong>{displayPrice}</strong>
                                        </p>

                                        <div
                                            style={{
                                                background: 'white',
                                                borderRadius: '16px',
                                                padding: '16px',
                                                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                                                display: 'inline-block',
                                            }}
                                        >
                                            <QRCodeSVG
                                                value={qrData}
                                                size={220}
                                                level="M"
                                                includeMargin={false}
                                                bgColor="#ffffff"
                                                fgColor="#1a1a1a"
                                            />
                                        </div>

                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--color-gray-500)',
                                                lineHeight: 1.5,
                                                textAlign: 'center',
                                                marginTop: '0.25rem',
                                            }}
                                        >
                                            Scan the QR — Google Pay / PhonePe / Paytm will open
                                            with the amount already filled.
                                            <br />
                                            Complete the payment and return here ❤️
                                        </p>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                goToStep('confirmation')
                                                navigate('/create/confirm')
                                            }}
                                            className="btn-primary"
                                            style={{ marginTop: '0.5rem' }}
                                            id="paid-upi-confirm"
                                        >
                                            I've Paid — Confirm Order →
                                        </motion.button>
                                    </div>
                                )}

                                {/* ═══════════════════════════════════════ */}
                                {/* FALLBACK OPTIONS (HDFC / failed links) */}
                                {/* ═══════════════════════════════════════ */}
                                <div
                                    style={{
                                        marginTop: '1.5rem',
                                        borderTop: '1px solid var(--color-gray-100)',
                                        paddingTop: '1.25rem',
                                    }}
                                >
                                    {/* Fallback 1: Try another app */}
                                    <div
                                        style={{
                                            background: 'var(--color-rose-50)',
                                            borderRadius: '12px',
                                            padding: '14px 16px',
                                            marginBottom: '0.75rem',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: 'var(--color-gray-700)',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            ⚡ Google Pay not working?
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-gray-500)',
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            If Google Pay fails (common with HDFC Bank),
                                            please try <strong>PhonePe</strong> or <strong>Paytm</strong> instead.
                                            {isMobile ? ' Tap the button again — your phone may offer a different app.' : ' Scan the QR with a different UPI app.'}
                                        </p>
                                    </div>

                                    {/* Fallback 2: Manual UPI */}
                                    <div
                                        style={{
                                            background: '#F8FAFC',
                                            borderRadius: '12px',
                                            padding: '14px 16px',
                                            textAlign: 'left',
                                            border: '1px solid var(--color-gray-100)',
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: 'var(--color-gray-700)',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            💳 Or pay manually in any UPI app
                                        </p>

                                        {/* UPI ID row */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'white',
                                                borderRadius: '8px',
                                                padding: '10px 12px',
                                                marginBottom: '8px',
                                                border: '1px dashed var(--color-gray-200)',
                                            }}
                                        >
                                            <div>
                                                <span
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--color-gray-400)',
                                                        display: 'block',
                                                    }}
                                                >
                                                    UPI ID
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600,
                                                        color: 'var(--color-gray-800)',
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    {UPI_ID}
                                                </span>
                                            </div>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleCopyUPI}
                                                style={{
                                                    background: copied
                                                        ? 'var(--color-green-500, #22C55E)'
                                                        : 'var(--color-primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '6px 14px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                    minWidth: '70px',
                                                }}
                                                id="copy-upi-button"
                                            >
                                                {copied ? '✓ Copied' : 'Copy'}
                                            </motion.button>
                                        </div>

                                        {/* Amount row */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '4px 12px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-gray-500)',
                                                }}
                                            >
                                                Amount
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-gray-800)',
                                                }}
                                            >
                                                {displayPrice}
                                            </span>
                                        </div>

                                        <p
                                            style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--color-gray-400)',
                                                marginTop: '8px',
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            Open any UPI app → Send money → Paste UPI ID → Enter amount → Pay
                                        </p>
                                    </div>

                                    {/* Trust / error message */}
                                    <p
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--color-gray-400)',
                                            textAlign: 'center',
                                            marginTop: '1rem',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Some banks (like HDFC) may block UPI deep links.
                                        <br />
                                        If payment fails, please try another UPI app or pay manually.
                                        <br />
                                        Your order will still be delivered ❤️
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ── INTERNATIONAL: PayPal ── */}
                        {!isIndia && (
                            <div className="flex flex-col items-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handlePayPalPayment}
                                    className="btn-primary w-2/3"
                                    id="pay-paypal-button"
                                >
                                    Pay {displayPrice} via PayPal →
                                </motion.button>
                                <p
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--color-gray-500)',
                                        lineHeight: 1.5,
                                        marginTop: '0.5rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    You'll be redirected to PayPal with the amount already filled.
                                    <br />
                                    Complete the payment and return here ❤️
                                </p>
                            </div>
                        )}

                        {/* Trust footer */}
                        <div
                            style={{
                                marginTop: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                            }}
                        >
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                                🔒 Secure payment • No card required
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)' }}>
                                📩 Digital delivery • No physical shipping
                            </span>
                        </div>

                        {/* Region toggle */}
                        <div className="text-center" style={{ marginTop: '0.75rem' }}>
                            <button
                                onClick={toggleRegion}
                                className="text-xs"
                                style={{
                                    color: 'var(--color-gray-500)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    opacity: 0.7,
                                }}
                            >
                                {isIndia
                                    ? 'Pay with PayPal instead (international)'
                                    : 'Pay with UPI instead (India)'}
                            </button>
                        </div>

                        {/* Back */}
                        <div className="text-center" style={{ marginTop: '0.5rem' }}>
                            <button
                                onClick={() => navigate('/create/preview')}
                                className="btn-ghost"
                            >
                                ← Back to preview
                            </button>
                        </div>
                    </motion.div>

                    {/* What happens next */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="what-next-card"
                        style={{ marginTop: '0.5rem' }}
                    >
                        <h4 className="what-next-title text-center">What happens next?</h4>
                        <div className="what-next-list">
                            <div className="what-next-item">
                                <span className="what-next-number">1</span>
                                <span className="what-next-text">
                                    Complete payment using{' '}
                                    {isIndia ? 'any UPI app (GPay, PhonePe, Paytm)' : 'PayPal'}.
                                </span>
                            </div>
                            <div className="what-next-item">
                                <span className="what-next-number">2</span>
                                <span className="what-next-text">
                                    Confirm your payment on the next screen with the transaction ID.
                                </span>
                            </div>
                            <div className="what-next-item">
                                <span className="what-next-number">3</span>
                                <span className="what-next-text">
                                    A beautiful, personalized email is sent to{' '}
                                    <strong>{recipientName}</strong> within minutes.
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
