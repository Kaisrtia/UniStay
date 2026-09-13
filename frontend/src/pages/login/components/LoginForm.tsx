import { useState, type FormEvent } from 'react'

import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'

import GoogleCredentialButton from '@/components/auth/GoogleCredentialButton'
import useAuth, { getUserFromAuthResponse } from '@/hooks/useAuth'

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

const LoginForm = () => {
  const navigate = useNavigate()
  const { loading, login, loginWithGoogle, getLastError } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setErrorMessage('')

    const formData = new FormData(event.currentTarget)
    const response = await login({
      email: String(formData.get('email') || '').trim().toLowerCase(),
      password: String(formData.get('password') || '')
    })

    if (response) {
      navigate(shouldCompleteProfile(response) ? '/onboarding' : '/home')
      return
    }

    setErrorMessage(getLastError() || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
  }

  const handleGoogleCredential = async (idToken: string) => {
    if (loading) {
      return
    }

    setErrorMessage('')

    const response = await loginWithGoogle({ idToken })

    if (response) {
      navigate(shouldCompleteProfile(response) ? '/onboarding' : '/home')
      return
    }

    setErrorMessage(getLastError() || 'Đăng nhập Google thất bại. Vui lòng thử lại.')
  }

  return (
    <form onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
      <div>
        <label className='mb-1 block text-sm font-semibold text-gray-700'>Email</label>
        <input
          name='email'
          type='email'
          placeholder='Nhập email của bạn'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>
      <div>
        <label className='mb-1 block text-sm font-semibold text-gray-700'>Mật khẩu</label>
        <input
          name='password'
          type='password'
          placeholder='********'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:ring-2 focus:ring-yellow-400'
        />
      </div>
      {errorMessage ? (
        <p className='rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold leading-5 text-red-600'>{errorMessage}</p>
      ) : null}
      <div className='mb-2 flex items-center justify-between text-xs'>
        <label className='flex cursor-pointer items-center gap-1'>
          <input type='checkbox' className='accent-yellow-400' />
          <span className='text-gray-600'>Ghi nhớ đăng nhập</span>
        </label>
        <Link to='/forgot-password' replace className='text-gray-500 hover:underline'>
          Quên mật khẩu
        </Link>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type='submit'
        disabled={loading}
        className='mt-1 rounded-lg bg-[#FFC300] px-3 py-2.5 font-extrabold text-[#001D3D] shadow-md transition hover:bg-[#ffcf33] disabled:cursor-not-allowed disabled:opacity-70'
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </motion.button>
      <GoogleCredentialButton
        disabled={loading}
        text='signin_with'
        onCredential={(idToken) => void handleGoogleCredential(idToken)}
        onError={(message) => setErrorMessage(message)}
      />
      <div className='mt-4 text-center text-xs text-gray-500'>
        Chưa có tài khoản?{' '}
        <Link to='/register' className='font-bold text-orange-500 hover:underline'>
          Đăng ký ngay
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
