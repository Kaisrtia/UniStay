import { useEffect, type FormEvent, useState } from 'react'
import { motion } from 'framer-motion'

import axios from 'axios'
import { FaKey, FaLock, FaSave } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import userService from '@/services/userService'

const googlePasswordMessage =
  'Tài khoản Google không thể đổi mật khẩu trong UniStay. Vui lòng quản lý mật khẩu trong tài khoản Google.'

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    const message = data?.error?.message || data?.message

    if (message === 'Users logged in with Google cannot change password') {
      return googlePasswordMessage
    }

    return message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
  }

  return 'Không thể đổi mật khẩu. Vui lòng thử lại.'
}

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const passwordPolicyMessage =
  'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'

const ChangePasswordPage = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isGoogleAccount, setIsGoogleAccount] = useState(false)
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    userService
      .getMyProfile()
      .then((profile) => {
        setIsGoogleAccount(profile?.provider === 'GOOGLE')
      })
      .catch(() => {
        setError('Không tải được thông tin tài khoản. Vui lòng đăng nhập lại.')
      })
  }, [])

  const newPasswordError = form.newPassword && !strongPasswordRegex.test(form.newPassword) ? passwordPolicyMessage : ''
  const confirmPasswordError =
    form.confirmPassword && form.newPassword !== form.confirmPassword
      ? 'Mật khẩu mới và mật khẩu xác nhận không khớp.'
      : ''
  const isSubmitDisabled =
    isGoogleAccount ||
    loading ||
    !form.currentPassword ||
    !form.newPassword ||
    !form.confirmPassword ||
    Boolean(newPasswordError || confirmPasswordError)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitDisabled) {
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await userService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      setMessage(response.message || 'Đã cập nhật mật khẩu.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (changePasswordError) {
      setError(getErrorMessage(changePasswordError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-3xl px-8 py-10'>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='inline-block'>
            <Link
              to='/account/profile'
              className='inline-flex rounded-full border border-[#003566] px-5 py-2 text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
            >
              Quay lại hồ sơ
            </Link>
          </motion.div>
        </motion.div>

        <motion.section 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
          className='mt-6 rounded-2xl bg-white p-8 shadow-lg shadow-[#001D3D]/5'
        >
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-full bg-[#FFC300] text-[#001D3D]'>
              <FaKey />
            </span>
            <div>
              <h1 className='text-3xl font-black'>Đổi mật khẩu</h1>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản UniStay của bạn.
              </p>
            </div>
          </div>

          {isGoogleAccount ? (
            <p className='mt-6 rounded-xl bg-[#FFF7D6] px-5 py-3 text-sm font-bold text-[#6F5616]'>
              {googlePasswordMessage}
            </p>
          ) : null}
          {message ? <p className='mt-6 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p> : null}
          {error ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p> : null}

          <form onSubmit={handleSubmit} className='mt-8 grid gap-5'>
            {[
              ['currentPassword', 'Mật khẩu hiện tại', ''],
              ['newPassword', 'Mật khẩu mới', newPasswordError],
              ['confirmPassword', 'Xác nhận mật khẩu mới', confirmPasswordError]
            ].map(([name, label, fieldError]) => (
              <label key={name} className='grid gap-2 text-sm font-extrabold'>
                {label}
                <span className='relative block'>
                  <FaLock className='absolute left-4 top-1/2 -translate-y-1/2 text-[#003566]' />
                  <input
                    name={name}
                    type='password'
                    value={form[name as keyof typeof form]}
                    disabled={isGoogleAccount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [name]: event.target.value
                      }))
                    }
                    className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 font-bold outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                      fieldError
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-[#FFC300] focus:ring-[#FFC300]/30'
                    }`}
                    placeholder='Nhập mật khẩu'
                  />
                </span>
                {fieldError ? <span className='text-xs font-bold text-red-600'>{fieldError}</span> : null}
              </label>
            ))}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type='submit'
              disabled={isSubmitDisabled}
              className='mt-2 inline-flex items-center justify-center gap-3 rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:bg-gray-300'
            >
              <FaSave />
              {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
            </motion.button>
          </form>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default ChangePasswordPage
