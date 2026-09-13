import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { FaEdit, FaMapMarkerAlt, FaPlus } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import postService, { type Post } from '@/services/postService'

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  UPDATED: 'Đã cập nhật',
  HIDDEN: 'Đã ẩn'
}

const statusClass = (status?: string) => {
  if (status === 'APPROVED') return 'bg-green-100 text-green-700'
  if (status === 'PENDING' || status === 'UPDATED') return 'bg-yellow-100 text-yellow-700'
  if (status === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const roomTypeLabels: Record<string, string> = {
  ROOM: 'Phòng trọ',
  APARTMENT: 'Căn hộ',
  HOUSE: 'Nhà nguyên căn'
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const MyPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const result = await postService.getMyPosts({ limit: 30 })
        setPosts(result.data)
      } catch {
        setMessage('Không tải được bài đăng của bạn. Hãy đăng nhập lại.')
      }
    }

    void loadPosts()
  }, [])

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-7xl px-8 py-10'>
        <div className='flex flex-wrap items-center justify-between gap-5'>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className='text-sm font-extrabold uppercase tracking-[0.24em] text-[#FFC300]'>UNISTAY</p>
            <h1 className='mt-3 text-4xl font-black'>Bài đăng của tôi</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              to='/posts/create'
              className='inline-flex items-center gap-3 rounded-full bg-[#FFC300] px-6 py-3 text-sm font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20 transition hover:bg-[#FFD60A] hover:-translate-y-0.5'
            >
              <FaPlus />
              Đăng tin mới
            </Link>
          </motion.div>
        </div>

        {message ? (
          <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{message}</p>
        ) : null}

        <section className='mt-8 grid gap-5'>
          <AnimatePresence>
            {posts.map((post, index) => {
              const isHidden = post.status === 'HIDDEN'
              
              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`grid gap-5 rounded-2xl p-5 shadow-lg shadow-[#001D3D]/5 transition hover:shadow-xl hover:shadow-[#001D3D]/10 md:grid-cols-[180px_minmax(0,1fr)_auto] ${
                    isHidden ? 'bg-gray-100 opacity-70 grayscale' : 'bg-white'
                  }`}
                >
                  <div className='h-32 overflow-hidden rounded-xl bg-[#001D3D]'>
                    {post.postImages?.[0]?.imageUrl ? (
                      <img src={post.postImages[0].imageUrl} alt={post.title} className='h-full w-full object-cover transition duration-300 hover:scale-105' />
                    ) : null}
                  </div>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-3'>
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(post.status)}`}>
                        {statusLabels[String(post.status)] || post.status}
                      </span>
                      <span className='text-sm font-bold text-gray-500'>
                        {roomTypeLabels[String(post.roomType)] || post.roomType}
                      </span>
                    </div>
                    <h2 className='mt-3 truncate text-2xl font-extrabold'>{post.title}</h2>
                    <p className='mt-2 flex items-center gap-2 text-sm text-gray-500'>
                      <FaMapMarkerAlt className='text-[#FFC300]' />
                      {post.detailAddress}
                    </p>
                    <p className='mt-3 text-lg font-black text-[#003566]'>
                      {currencyFormatter.format(Number(post.price || 0))}
                    </p>
                  </div>
                  <div className='flex items-center gap-3 md:flex-col md:items-end md:justify-center'>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to={`/posts/${post.id}`}
                        className='inline-flex rounded-full bg-[#001D3D] px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#003566]'
                      >
                        Xem chi tiết
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to={`/posts/create?edit=${post.id}`}
                        className='inline-flex items-center gap-2 rounded-full bg-[#FFF1B8] px-5 py-2 text-sm font-extrabold text-[#6F5616] transition hover:bg-[#FFE28A]'
                      >
                        <FaEdit />
                        Sửa
                      </Link>
                    </motion.div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>

          {!message && posts.length === 0 ? (
            <div className='rounded-2xl bg-white p-10 text-center shadow-lg shadow-[#001D3D]/5'>
              <p className='font-bold text-gray-500'>Bạn chưa có bài đăng nào.</p>
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default MyPostsPage
