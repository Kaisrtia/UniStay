import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { FaArrowLeft, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaUniversity, FaUserGraduate } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import contactService, { type ReceivedContactRequest, type SentContactRequest } from '@/services/contactService'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const statusLabels: Record<string, string> = {
  PENDING: 'Đang chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối'
}

const getStoredRoles = () => {
  try {
    const rawUser = localStorage.getItem('authUser')
    if (!rawUser) return []
    const user = JSON.parse(rawUser) as { roles?: string[] }
    return user.roles || []
  } catch {
    return []
  }
}

const ContactRequestsPage = () => {
  const [receivedRequests, setReceivedRequests] = useState<ReceivedContactRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SentContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const roles = useMemo(() => getStoredRoles(), [])
  const isStudent = roles.includes('STUDENT')
  const isHost = roles.includes('HOST')

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true)
      setMessage('')

      try {
        const tasks: Array<Promise<void>> = []

        if (isHost || !isStudent) {
          tasks.push(
            contactService.getReceivedRequests({ limit: 60 }).then((result) => {
              setReceivedRequests(result.data)
            })
          )
        }

        if (isStudent) {
          tasks.push(
            contactService.getSentRequests({ limit: 60 }).then((result) => {
              setSentRequests(result.data)
            })
          )
          tasks.push(
            contactService.getReceivedRequests({ limit: 60 }).then((result) => {
              setReceivedRequests(result.data)
            })
          )
        }

        await Promise.all(tasks)
      } catch {
        setMessage('Không tải được danh sách liên hệ. Vui lòng đăng nhập lại.')
      } finally {
        setLoading(false)
      }
    }

    void loadRequests()
  }, [isHost, isStudent])

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-7xl px-8 py-10'>
        <div className='flex flex-wrap items-center justify-between gap-5'>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='inline-block'>
              <Link
                to='/home'
                aria-label='Quay lại trang chủ'
                title='Quay lại trang chủ'
                className='inline-grid h-10 w-10 place-items-center rounded-full border border-[#003566] text-sm font-extrabold text-[#003566] transition hover:bg-[#003566] hover:text-white'
              >
                <FaArrowLeft />
              </Link>
            </motion.div>
            <p className='mt-6 text-sm font-extrabold uppercase tracking-[0.24em] text-[#FFC300]'>UNISTAY</p>
            <h1 className='mt-3 text-4xl font-black'>Danh sách đã liên hệ</h1>
            <p className='mt-3 max-w-2xl text-gray-500'>
              Theo dõi các yêu cầu thuê, ở ghép và thông tin liên hệ cần thiết để trao đổi tiếp.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to='/posts/search'
                className='inline-flex rounded-full bg-[#FFC300] px-6 py-3 text-sm font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20 transition hover:bg-[#FFD60A]'
              >
                Tìm thêm bài đăng
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {message ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{message}</p> : null}

        {loading ? (
          <section className='mt-8 rounded-2xl bg-white p-10 text-center shadow-lg shadow-[#001D3D]/5'>
            <p className='font-bold text-gray-500'>Đang tải danh sách liên hệ...</p>
          </section>
        ) : (
          <div className='mt-8 grid gap-8'>
            {receivedRequests.length > 0 || isHost ? (
              <section>
                <h2 className='text-2xl font-black'>Sinh viên đã liên hệ bài đăng của bạn</h2>
                <div className='mt-4 grid gap-5'>
                  <AnimatePresence>
                    {receivedRequests.map((request, index) => (
                      <motion.article 
                        key={`${request.postId}-${request.userId}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className='rounded-2xl bg-white p-5 shadow-lg shadow-[#001D3D]/5 transition hover:shadow-xl'
                      >
                        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
                          <div>
                            <span className='rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-extrabold text-[#7A5A00]'>
                              {statusLabels[request.status] || request.status}
                            </span>
                            <h3 className='mt-3 text-2xl font-black'>{request.user.fullName}</h3>
                            <p className='mt-2 text-sm font-bold text-gray-500'>Quan tâm: {request.post.title}</p>
                            <div className='mt-4 grid gap-3 text-sm md:grid-cols-2'>
                              <span className='inline-flex items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 font-bold'>
                                <FaPhoneAlt className='text-[#003566]' />
                                {request.user.phone || 'Chưa cập nhật số điện thoại'}
                              </span>
                              <span className='inline-flex items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 font-bold'>
                                <FaEnvelope className='text-[#003566]' />
                                {request.user.email}
                              </span>
                              <span className='inline-flex items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 font-bold'>
                                <FaUserGraduate className='text-[#003566]' />
                                {request.user.gender || 'Chưa cập nhật giới tính'}
                              </span>
                              <span className='inline-flex items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 font-bold'>
                                <FaUniversity className='text-[#003566]' />
                                {request.user.student?.university?.name || 'Chưa cập nhật trường học'}
                              </span>
                            </div>
                          </div>
                          <div className='rounded-2xl border border-gray-100 p-4'>
                            <p className='text-sm font-extrabold uppercase text-[#FFC300]'>Bài đăng</p>
                            <h4 className='mt-2 text-xl font-black'>{request.post.title}</h4>
                            <p className='mt-2 flex items-center gap-2 text-sm font-bold text-gray-500'>
                              <FaMapMarkerAlt className='text-[#FFC300]' />
                              {request.post.ward?.name || request.post.detailAddress}
                            </p>
                            <p className='mt-3 text-xl font-black text-[#003566]'>
                              {currencyFormatter.format(Number(request.post.price || 0))}
                            </p>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='mt-4 inline-block'>
                              <Link
                                to={`/posts/${request.postId}`}
                                className='inline-flex rounded-full bg-[#001D3D] px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#003566]'
                              >
                                Xem bài đăng
                              </Link>
                            </motion.div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                  {receivedRequests.length === 0 ? (
                    <div className='rounded-2xl bg-white p-8 text-center shadow-lg shadow-[#001D3D]/5'>
                      <p className='font-bold text-gray-500'>Chưa có sinh viên nào liên hệ bài đăng của bạn.</p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {isStudent ? (
              <section>
                <h2 className='text-2xl font-black'>Bài đăng bạn đã liên hệ</h2>
                <div className='mt-4 grid gap-5 md:grid-cols-2'>
                  <AnimatePresence>
                    {sentRequests.map((request, index) => (
                      <motion.article 
                        key={`${request.postId}-${request.userId}`} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className='rounded-2xl bg-white p-5 shadow-lg shadow-[#001D3D]/5 transition hover:shadow-xl'
                      >
                        <span className='rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-extrabold text-[#7A5A00]'>
                          {statusLabels[request.status] || request.status}
                        </span>
                        <h3 className='mt-3 text-2xl font-black'>{request.post.title}</h3>
                        <p className='mt-2 text-sm font-bold text-gray-500'>
                          Chủ bài: {request.post.user?.fullName || 'Chưa có thông tin'}
                        </p>
                        <div className='mt-4 grid gap-3 text-sm'>
                          <span className='inline-flex items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 font-bold'>
                            <FaPhoneAlt className='text-[#003566]' />
                            {request.post.user?.phone || 'Chưa cập nhật số điện thoại'}
                          </span>
                          <span className='inline-flex items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 font-bold'>
                            <FaEnvelope className='text-[#003566]' />
                            {request.post.user?.email || 'Chưa cập nhật email'}
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='mt-4 inline-block'>
                          <Link
                            to={`/posts/${request.postId}`}
                            className='inline-flex rounded-full bg-[#001D3D] px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#003566]'
                          >
                            Xem chi tiết
                          </Link>
                        </motion.div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                  {sentRequests.length === 0 ? (
                    <div className='rounded-2xl bg-white p-8 text-center shadow-lg shadow-[#001D3D]/5 md:col-span-2'>
                      <p className='font-bold text-gray-500'>Bạn chưa gửi yêu cầu thuê hoặc ở ghép nào.</p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

export default ContactRequestsPage
