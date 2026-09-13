import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { FaArrowLeft, FaBan, FaUserCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import userService, { type BlockedUserItem } from '@/services/userService'

const roleLabels: Record<string, string> = {
  USER: 'Người dùng',
  STUDENT: 'Sinh viên',
  HOST: 'Chủ trọ',
  ADMIN: 'Quản trị viên'
}

const BlockedUsersPage = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadBlockedUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await userService.getBlockedUsers()
      setBlockedUsers(result)
    } catch {
      setError('Không thể tải danh sách người dùng đã chặn. Vui lòng đăng nhập lại và thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBlockedUsers()
  }, [])

  const handleUnblock = async (blockedId: string) => {
    setProcessingId(blockedId)
    setMessage('')
    setError('')

    try {
      await userService.unblockUser(blockedId)
      setBlockedUsers((current) => current.filter((item) => item.blockedUser.id !== blockedId))
      setMessage('Đã bỏ chặn người dùng.')
    } catch {
      setError('Không thể bỏ chặn người dùng. Vui lòng thử lại.')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 text-[#181A20]'>
      <SiteHeader />
      <main className='px-4 py-10'>
        <section className='mx-auto max-w-5xl'>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className='inline-block'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to='/account/profile'
                className='inline-flex items-center gap-2 rounded-full border border-[#003566] px-4 py-2 text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
              >
                <FaArrowLeft />
                Quay lại tài khoản
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
            className='mt-6 rounded-2xl bg-white p-6 shadow-lg shadow-[#001D3D]/5'
          >
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='text-sm font-extrabold uppercase tracking-wide text-[#D79A00]'>Cài đặt tài khoản</p>
                <h1 className='mt-2 text-3xl font-black text-gray-950'>Danh sách đã chặn</h1>
                <p className='mt-2 max-w-2xl text-sm font-semibold leading-6 text-gray-500'>
                  Người trong danh sách này sẽ không thể thấy bài đăng, bình luận hoặc gửi yêu cầu liên hệ với bạn.
                </p>
              </div>
              <div className='grid h-14 w-14 place-items-center rounded-full bg-[#FFF7D6] text-2xl text-[#D79A00]'>
                <FaBan />
              </div>
            </div>

            {message ? (
              <p className='mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700'>{message}</p>
            ) : null}
            {error ? (
              <p className='mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600'>{error}</p>
            ) : null}

            <div className='mt-6 grid gap-4'>
              {loading ? (
                <div className='rounded-xl bg-gray-50 px-4 py-5 text-sm font-semibold text-gray-500'>
                  Đang tải danh sách chặn...
                </div>
              ) : blockedUsers.length > 0 ? (
                <AnimatePresence>
                  {blockedUsers.map(({ blockedUser, createdAt }, index) => {
                    const role = blockedUser.roles?.[0] || 'USER'
  
                    return (
                      <motion.article
                        key={blockedUser.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className='flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4'
                      >
                        <div className='flex min-w-0 items-center gap-4'>
                          <div className='grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#001D3D] text-lg text-[#FFC300]'>
                            {blockedUser.avatarUrl ? (
                              <img
                                src={blockedUser.avatarUrl}
                                alt={blockedUser.fullName}
                                className='h-full w-full object-cover'
                              />
                            ) : (
                              <FaUserCircle />
                            )}
                          </div>
                          <div className='min-w-0'>
                            <h2 className='truncate text-lg font-black text-gray-950'>{blockedUser.fullName}</h2>
                            <p className='mt-1 text-sm font-semibold text-gray-500'>
                              {roleLabels[role] || role} • {blockedUser.email}
                            </p>
                            <p className='mt-1 text-xs font-semibold text-gray-400'>
                              Đã chặn từ {new Date(createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type='button'
                          disabled={processingId === blockedUser.id}
                          onClick={() => void handleUnblock(blockedUser.id)}
                          className='rounded-xl border border-[#003566] px-5 py-3 text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          {processingId === blockedUser.id ? 'Đang bỏ chặn...' : 'Bỏ chặn'}
                        </motion.button>
                      </motion.article>
                    )
                  })}
                </AnimatePresence>
              ) : (
                <div className='rounded-xl bg-gray-50 px-4 py-5 text-sm font-semibold text-gray-500'>
                  Bạn chưa chặn người dùng nào.
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default BlockedUsersPage
