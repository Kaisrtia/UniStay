import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'

import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowLeft, FaCheckCircle, FaEnvelopeOpenText, FaRegEdit, FaSync } from 'react-icons/fa'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { background } from '@/assets/images'
import authService from '@/services/authService'
import { translateAuthMessage } from '@/utils/authMessages'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const initialEmail = (
    (location.state as { email?: string } | null)?.email ||
    searchParams.get('email') ||
    ''
  ).trim()

  const initialCode = (searchParams.get('code') || searchParams.get('token') || '').trim()

  const [email, setEmail] = useState(initialEmail)
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail)
  const [tempEmail, setTempEmail] = useState(initialEmail)

  const [otp, setOtp] = useState<string[]>(() => {
    if (initialCode && initialCode.length === OTP_LENGTH) {
      return initialCode.split('')
    }
    return Array(OTP_LENGTH).fill('')
  })

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // Focus first input on mount
  useEffect(() => {
    if (!isEditingEmail && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [isEditingEmail])

  // Verify email function
  const handleVerify = useCallback(
    async (codeToVerify?: string) => {
      const targetEmail = email.trim()
      const code = (codeToVerify || otp.join('')).trim()

      if (!targetEmail) {
        setErrorMessage('Vui lòng nhập địa chỉ email.')
        return
      }

      if (code.length !== OTP_LENGTH) {
        setErrorMessage('Vui lòng nhập đủ 6 chữ số mã xác thực.')
        return
      }

      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      try {
        const response = await authService.verifyEmail({ email: targetEmail, code })
        const message = translateAuthMessage(response.message) || 'Xác thực email thành công!'
        setSuccessMessage(message)
        setIsVerified(true)

        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 1800)
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
          const translated = translateAuthMessage(data?.error?.message || data?.message)
          setErrorMessage(translated || 'Mã xác thực không hợp lệ hoặc đã hết hạn.')
        } else {
          setErrorMessage('Xác thực thất bại. Vui lòng kiểm tra lại mã.')
        }
      } finally {
        setLoading(false)
      }
    },
    [email, navigate, otp]
  )

  // Auto-verify if code and email are both in URL params
  useEffect(() => {
    if (initialEmail && initialCode && initialCode.length === OTP_LENGTH) {
      void handleVerify(initialCode)
    }
  }, [initialCode, initialEmail, handleVerify])

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric input
    const cleaned = value.replace(/\D/g, '')

    if (!cleaned) {
      const nextOtp = [...otp]
      nextOtp[index] = ''
      setOtp(nextOtp)
      return
    }

    // If multiple digits entered or pasted into a box
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, OTP_LENGTH).split('')
      const nextOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          nextOtp[index + i] = digit
        }
      })
      setOtp(nextOtp)

      const nextFocus = Math.min(index + digits.length, OTP_LENGTH - 1)
      inputRefs.current[nextFocus]?.focus()

      if (nextOtp.every((digit) => digit.trim() !== '')) {
        void handleVerify(nextOtp.join(''))
      }
      return
    }

    const nextOtp = [...otp]
    nextOtp[index] = cleaned

    setOtp(nextOtp)
    setErrorMessage('')

    // Move to next input if digit entered
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit if all digits are entered
    if (nextOtp.every((digit) => digit.trim() !== '')) {
      void handleVerify(nextOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const nextOtp = [...otp]
    pasted.split('').forEach((char, i) => {
      nextOtp[i] = char
    })
    setOtp(nextOtp)

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()

    if (nextOtp.every((digit) => digit.trim() !== '')) {
      void handleVerify(nextOtp.join(''))
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0 || resending) return

    const targetEmail = email.trim()
    if (!targetEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email để nhận mã.')
      return
    }

    setResending(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await authService.sendEmailVerification({ email: targetEmail })
      setSuccessMessage('Mã xác thực mới đã được gửi tới email của bạn.')
      setCountdown(RESEND_COOLDOWN)
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
        const translated = translateAuthMessage(data?.error?.message || data?.message)
        setErrorMessage(translated || 'Không thể gửi lại mã xác thực. Vui lòng thử lại sau.')
      } else {
        setErrorMessage('Không thể gửi lại mã xác thực. Vui lòng thử lại sau.')
      }
    } finally {
      setResending(false)
    }
  }

  const handleSaveEmail = () => {
    if (!tempEmail.trim()) {
      setErrorMessage('Email không được để trống.')
      return
    }
    setEmail(tempEmail.trim())
    setIsEditingEmail(false)
    setErrorMessage('')
  }

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-y-auto px-4 py-8'>
      {/* Background layer */}
      <div
        className='fixed inset-0 -z-10'
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className='fixed inset-0 -z-10 bg-[#001D3D]/50 backdrop-blur-sm' />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 shadow-2xl shadow-[#001D3D]/25 sm:p-10'
      >
        <AnimatePresence mode='wait'>
          {isVerified ? (
            /* Success State */
            <motion.div
              key='success'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className='py-8 text-center'
            >
              <div className='mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner'>
                <FaCheckCircle className='text-5xl animate-bounce' />
              </div>
              <h2 className='mt-6 text-2xl font-black text-[#001D3D]'>Xác thực thành công!</h2>
              <p className='mt-2 text-sm text-gray-500'>
                {successMessage || 'Tài khoản của bạn đã được kích hoạt thành công.'}
              </p>
              <p className='mt-4 text-xs font-semibold text-gray-400'>
                Đang tự động chuyển hướng đến trang đăng nhập...
              </p>
              <div className='mt-6'>
                <Link
                  to='/login'
                  replace
                  className='inline-flex rounded-full bg-[#FFC300] px-8 py-3 text-sm font-extrabold text-[#001D3D] shadow-md transition hover:bg-[#FFD60A]'
                >
                  Đăng nhập ngay
                </Link>
              </div>
            </motion.div>
          ) : (
            /* OTP Input Form */
            <motion.div key='form' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header Icon */}
              <div className='mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#001D3D] text-[#FFC300] shadow-lg shadow-[#001D3D]/20'>
                <FaEnvelopeOpenText className='text-2xl' />
              </div>

              {/* Title & Description */}
              <div className='mt-6 text-center'>
                <h1 className='text-2xl font-black tracking-tight text-[#001D3D] sm:text-3xl'>
                  XÁC THỰC EMAIL
                </h1>
                <p className='mt-2 text-xs text-gray-500 sm:text-sm'>
                  Nhập mã xác thực gồm 6 chữ số đã được gửi đến email của bạn
                </p>

                {/* Email Address Display / Edit */}
                <div className='mt-4 flex flex-col items-center justify-center gap-2'>
                  {isEditingEmail ? (
                    <div className='flex w-full max-w-sm items-center gap-2'>
                      <input
                        type='email'
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        placeholder='nhap-email@unistay.vn'
                        className='h-10 flex-1 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-[#001D3D] outline-none focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                      />
                      <button
                        type='button'
                        onClick={handleSaveEmail}
                        className='h-10 rounded-xl bg-[#001D3D] px-4 text-xs font-bold text-white transition hover:bg-[#003566]'
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <div className='inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-[#F5F7FA] px-4 py-1.5 text-xs font-bold text-[#003566] sm:text-sm'>
                      <span className='truncate'>{email || 'Chưa cung cấp email'}</span>
                      <button
                        type='button'
                        onClick={() => {
                          setTempEmail(email)
                          setIsEditingEmail(true)
                        }}
                        className='text-gray-400 transition hover:text-[#0D63C2]'
                        title='Đổi địa chỉ email'
                      >
                        <FaRegEdit />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Alerts */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-600'
                >
                  {errorMessage}
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700'
                >
                  {successMessage}
                </motion.div>
              )}

              {/* 6-Digit OTP Input Boxes */}
              <div className='mt-8 flex justify-center gap-2 sm:gap-3'>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    className='h-12 w-11 rounded-xl border-2 border-gray-200 bg-[#F8FAFC] text-center text-xl font-black text-[#001D3D] shadow-sm outline-none transition focus:border-[#FFC300] focus:bg-white focus:ring-4 focus:ring-[#FFC300]/20 disabled:opacity-50 sm:h-14 sm:w-13 sm:text-2xl'
                  />
                ))}
              </div>

              {/* Verify Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='button'
                onClick={() => void handleVerify()}
                disabled={loading || otp.some((digit) => !digit)}
                className='mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC300] py-3 text-sm font-extrabold text-[#001D3D] shadow-md transition hover:bg-[#FFD60A] disabled:cursor-not-allowed disabled:opacity-50'
              >
                {loading ? (
                  <>
                    <FaSync className='animate-spin text-sm' />
                    Đang xác thực...
                  </>
                ) : (
                  'Xác thực email'
                )}
              </motion.button>

              {/* Resend Code Section */}
              <div className='mt-6 text-center'>
                <p className='text-xs text-gray-500'>Bạn chưa nhận được mã xác thực?</p>
                {countdown > 0 ? (
                  <p className='mt-1 text-xs font-semibold text-gray-400'>
                    Có thể gửi lại sau <span className='font-bold text-[#001D3D]'>{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type='button'
                    onClick={() => void handleResendCode()}
                    disabled={resending}
                    className='mt-1.5 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0D63C2] transition hover:text-[#003566] disabled:opacity-50'
                  >
                    <FaSync className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Đang gửi mã...' : 'Gửi lại mã xác thực'}
                  </button>
                )}
              </div>

              {/* Footer Back Links */}
              <div className='mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-500'>
                <Link
                  to='/login'
                  className='inline-flex items-center gap-1.5 font-bold text-[#003566] transition hover:underline'
                >
                  <FaArrowLeft className='text-[10px]' />
                  Quay lại đăng nhập
                </Link>
                <span className='mx-3 text-gray-300'>•</span>
                <Link
                  to='/register'
                  className='font-bold text-gray-500 transition hover:text-[#001D3D] hover:underline'
                >
                  Đăng ký tài khoản khác
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default VerifyEmailPage
