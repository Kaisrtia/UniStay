import { type FormEvent, useState } from 'react'

import axios from 'axios'
import { motion } from 'framer-motion'
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import authService from '@/services/authService'
import { translateAuthMessage } from '@/utils/authMessages'

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    return translateAuthMessage(data?.error?.message || data?.message) || 'Không thể gửi email đặt lại mật khẩu.'
  }

  return 'Không thể gửi email đặt lại mật khẩu.'
}

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await authService.sendForgotPassword({ email })
      setMessage(
        translateAuthMessage(response.message) || 'Đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra email của bạn.'
      )
    } catch (forgotPasswordError) {
      setError(getErrorMessage(forgotPasswordError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-xl px-8 py-12'>
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className='rounded-2xl bg-white p-8 shadow-2xl shadow-[#001D3D]/10'
        >
          <h1 className='text-3xl font-black'>Quên mật khẩu</h1>
          <p className='mt-3 text-sm leading-6 text-gray-500'>
            Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
          </p>

          {message ? <p className='mt-6 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p> : null}
          {error ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p> : null}

          <form onSubmit={handleSubmit} className='mt-8 grid gap-5'>
            <label className='grid gap-2 text-sm font-extrabold'>
              Email
              <span className='relative block'>
                <FaEnvelope className='absolute left-4 top-1/2 -translate-y-1/2 text-[#003566]' />
                <input
                  name='email'
                  type='email'
                  className='h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 font-bold outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                  placeholder='email@unistay.vn'
                />
              </span>
            </label>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type='submit'
              disabled={loading}
              className='inline-flex items-center justify-center gap-3 rounded-full bg-[#FFC300] px-6 py-3 text-sm font-extrabold text-[#001D3D] shadow-md transition hover:bg-[#FFD60A] disabled:cursor-not-allowed disabled:bg-gray-300'
            >
              <FaPaperPlane />
              {loading ? 'Đang gửi...' : 'Gửi liên kết'}
            </motion.button>
          </form>

          <Link to='/login' className='mt-6 inline-flex text-sm font-extrabold text-[#003566] hover:underline'>
            Quay lại đăng nhập
          </Link>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default ForgotPasswordPage
