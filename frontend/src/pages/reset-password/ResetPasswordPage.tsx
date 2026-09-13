import { type FormEvent, useState } from 'react'

import axios from 'axios'
import { motion } from 'framer-motion'
import { FaLock, FaSave } from 'react-icons/fa'
import { Link, useSearchParams } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import authService from '@/services/authService'
import { translateAuthMessage } from '@/utils/authMessages'

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    return translateAuthMessage(data?.error?.message || data?.message) || 'Không thể đặt lại mật khẩu.'
  }

  return 'Không thể đặt lại mật khẩu.'
}

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const token = searchParams.get('token') || ''

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const newPassword = String(formData.get('newPassword') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
      setMessage('')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không khớp.')
      setMessage('')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await authService.resetPassword({ token, newPassword })
      setMessage(
        translateAuthMessage(response.message) || 'Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.'
      )
      event.currentTarget.reset()
    } catch (resetPasswordError) {
      setError(getErrorMessage(resetPasswordError))
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
          <h1 className='text-3xl font-black'>Đặt lại mật khẩu</h1>
          <p className='mt-3 text-sm leading-6 text-gray-500'>
            Tạo mật khẩu mới cho tài khoản UniStay của bạn.
          </p>

          {message ? <p className='mt-6 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p> : null}
          {error ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p> : null}

          <form onSubmit={handleSubmit} className='mt-8 grid gap-5'>
            {[
              ['newPassword', 'Mật khẩu mới'],
              ['confirmPassword', 'Xác nhận mật khẩu mới']
            ].map(([name, label]) => (
              <label key={name} className='grid gap-2 text-sm font-extrabold'>
                {label}
                <span className='relative block'>
                  <FaLock className='absolute left-4 top-1/2 -translate-y-1/2 text-[#003566]' />
                  <input
                    name={name}
                    type='password'
                    className='h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 font-bold outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                    placeholder='Nhập mật khẩu mới'
                  />
                </span>
              </label>
            ))}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type='submit'
              disabled={loading || !token}
              className='inline-flex items-center justify-center gap-3 rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:bg-gray-300'
            >
              <FaSave />
              {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
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

export default ResetPasswordPage
