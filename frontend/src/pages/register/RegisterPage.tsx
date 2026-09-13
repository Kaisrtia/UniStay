import { motion } from 'framer-motion'

import { dutPicture, background } from '@/assets/images'

import { RegisterForm } from './components/RegisterForm'


const RegisterPage = () => (
  <div className='relative min-h-screen flex items-center justify-center p-4'>
    <div 
      className='absolute inset-0 -z-10'
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
    </div>

    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='bg-white rounded-2xl shadow-2xl flex w-full max-w-4xl overflow-hidden min-h-[550px]'
    > 
      <div className='hidden md:block md:w-1/2'>
        <img 
          src={dutPicture} 
          alt='DUT Building' 
          className='h-full w-full object-cover'
        />
      </div>

      <div className='w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12'>
        <div className='mb-6'>
          <h2 className='text-3xl font-extrabold text-[#0a183d]'>TẠO TÀI KHOẢN</h2>
          <p className='text-gray-500 mt-2'>Hãy điền thông tin đăng ký của bạn!</p>
        </div>
        <RegisterForm />
      </div>
    </motion.div>
  </div>
)

export default RegisterPage
