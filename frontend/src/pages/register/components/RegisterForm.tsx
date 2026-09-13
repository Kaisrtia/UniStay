import { type FormEvent } from 'react'

import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'

import GoogleCredentialButton from '@/components/auth/GoogleCredentialButton'
import useAuth, { getUserFromAuthResponse } from '@/hooks/useAuth'
import authService from '@/services/authService'
import { translateAuthMessage } from '@/utils/authMessages'

const shouldCompleteProfile = (response: unknown) => {
  const user = getUserFromAuthResponse(response as Parameters<typeof getUserFromAuthResponse>[0])
  const roles = user?.roles || []
  const isAdmin = roles.includes('ADMIN')
  return (
    user?.status === 'SET_UP' ||
    (!roles.includes('STUDENT') && !roles.includes('HOST') && !isAdmin) ||
    (!isAdmin && !String(user?.phone || '').trim())
  )
}

export const RegisterForm = () => {
  const navigate = useNavigate()
  const { loading, register, loginWithGoogle, getLastError } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const fullName = String(formData.get('fullName') || '').trim()

    if (!fullName || !email || !password) {
      alert('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.')
      return
    }

    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp.')
      return
    }

    const response = await register({
      fullName,
      email,
      password
    })

    if (response) {
      const message = translateAuthMessage(response.message) || 'Đăng ký thành công.'

      try {
        await authService.sendEmailVerification({ email })
      } catch {
        alert('Đăng ký thành công nhưng chưa gửi được email xác thực. Vui lòng thử gửi lại mã xác thực sau.')
        return
      }

      alert(`${message}\nVui lòng kiểm tra email để xác thực tài khoản.`)
      navigate('/login')
      return
    }

    alert(getLastError() || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
  }

  const handleGoogleCredential = async (idToken: string) => {
    if (loading) {
      return
    }

    const response = await loginWithGoogle({ idToken })

    if (response) {
      navigate(shouldCompleteProfile(response) ? '/onboarding' : '/home')
      return
    }

    alert(getLastError() || 'Đăng ký bằng Google thất bại. Vui lòng thử lại.')
  }

  return (
    <form onSubmit={handleSubmit} className='flex w-full flex-col gap-2'>
      <div>
        <label className='mb-1 block text-xs font-semibold text-gray-700'>Họ và tên</label>
        <input
          name='fullName'
          type='text'
          placeholder='Nhập họ và tên của bạn'
          className='w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>

      <div>
        <label className='mb-1 block text-xs font-semibold text-gray-700'>Email</label>
        <input
          name='email'
          type='email'
          placeholder='Nhập địa chỉ email'
          className='w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>

      <div>
        <label className='mb-1 block text-xs font-semibold text-gray-700'>Mật khẩu</label>
        <input
          name='password'
          type='password'
          placeholder='********'
          className='w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>

      <div>
        <label className='mb-1 block text-xs font-semibold text-gray-700'>Xác nhận mật khẩu</label>
        <input
          name='confirmPassword'
          type='password'
          placeholder='********'
          className='w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type='submit'
        disabled={loading}
        className='mt-2 rounded-lg bg-[#FFC300] px-3 py-2 text-sm font-extrabold text-[#001D3D] shadow-md transition hover:bg-[#ffcf33] disabled:cursor-not-allowed disabled:opacity-70'
      >
        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
      </motion.button>

      <GoogleCredentialButton
        disabled={loading}
        text='signup_with'
        onCredential={(idToken) => void handleGoogleCredential(idToken)}
        onError={(message) => alert(message)}
      />

      <div className='mt-2 text-center text-[11px] text-gray-500'>
        Đã có tài khoản?{' '}
        <Link to='/login' className='font-bold text-orange-500 hover:underline'>
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  )
}

export default RegisterForm
