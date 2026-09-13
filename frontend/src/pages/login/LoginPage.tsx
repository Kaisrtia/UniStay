import { motion } from 'framer-motion'

import { background, dutPicture } from '@/assets/images'

import LoginForm from './components/LoginForm'

const LoginPage = () => (
  <div className='relative flex min-h-dvh items-center justify-center overflow-y-auto px-4 py-8'>
    {/* Full-page Background Image Layer */}
    <div
      className='fixed inset-0 -z-10'
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
      }}

    />

    {/* Main Card */}
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl md:min-h-[min(620px,calc(100dvh-4rem))]'
    >


      {/* Left side: DUT Picture (Hidden on mobile) */}
      <div className='hidden md:block md:w-1/2'>
        <img src={dutPicture} alt='DUT Building' className='h-full w-full object-cover' />
      </div>

      {/* Right side: Login Form */}
      <div className='flex w-full flex-col justify-center p-6 sm:p-8 md:w-1/2 md:p-10 lg:p-12'>
        <div className='mb-6 md:mb-8'>
          <h2 className='text-3xl font-extrabold text-[#0a183d]'>CHÀO MỪNG QUAY LẠI</h2>
          <p className='text-gray-500 mt-2'>Hãy nhập thông tin đăng nhập của bạn!</p>
        </div>
        <LoginForm />
      </div>
    </motion.div>
  </div>
)

export default LoginPage
