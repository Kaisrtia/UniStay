import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { FaArrowLeft, FaHeart, FaMapMarkerAlt, FaTrash } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import engagementService from '@/services/engagementService'
import { type Post } from '@/services/postService'

const fallbackImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const roomTypeLabels: Record<string, string> = {
  ROOM: 'Phòng trọ',
  APARTMENT: 'Căn hộ',
  HOUSE: 'Nhà nguyên căn'
}

const FavouritePostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadFavourites = async () => {
    setLoading(true)
    setMessage('')

    try {
      const result = await engagementService.getFavouritePosts({ limit: 60 })
      setPosts(result.data)
    } catch {
      setMessage('Không tải được danh sách yêu thích. Vui lòng đăng nhập bằng tài khoản sinh viên.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFavourites()
  }, [])

  const handleRemove = async (postId: string) => {
    try {
      await engagementService.removeFavouritePost(postId)
      setPosts((current) => current.filter((post) => post.id !== postId))
    } catch {
      setMessage('Không thể bỏ lưu bài đăng. Vui lòng thử lại.')
    }
  }

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
            <h1 className='mt-3 text-4xl font-black'>Bài đăng yêu thích</h1>
            <p className='mt-3 max-w-2xl text-gray-500'>
              Lưu lại những phòng phù hợp để so sánh giá, vị trí và liên hệ khi cần.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              to='/posts/search'
              className='inline-flex items-center gap-3 rounded-full bg-[#FFC300] px-6 py-3 text-sm font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20 transition hover:bg-[#FFD60A] hover:-translate-y-0.5'
            >
              <FaHeart />
              Tìm thêm phòng
            </Link>
          </motion.div>
        </div>

        {message ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{message}</p> : null}

        <section className='mt-8'>
          {loading ? (
            <div className='rounded-2xl bg-white p-10 text-center shadow-lg shadow-[#001D3D]/5'>
              <p className='font-bold text-gray-500'>Đang tải danh sách yêu thích...</p>
            </div>
          ) : null}

          {!loading && posts.length === 0 ? (
            <div className='rounded-2xl bg-white p-10 text-center shadow-lg shadow-[#001D3D]/5'>
              <p className='text-lg font-extrabold text-[#181A20]'>Bạn chưa lưu bài đăng nào.</p>
              <p className='mt-2 text-sm text-gray-500'>Hãy lưu những bài phù hợp để xem lại nhanh hơn.</p>
            </div>
          ) : null}

          <motion.div layout className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.article 
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className='overflow-hidden rounded-2xl bg-white shadow-lg shadow-[#001D3D]/5'
                >
                  <Link to={`/posts/${post.id}`} className='block'>
                    <div className='h-52 overflow-hidden bg-[#001D3D]'>
                      <img
                        src={post.postImages?.[0]?.imageUrl || fallbackImage}
                        alt={post.title}
                        className='h-full w-full object-cover transition duration-300 hover:scale-105'
                      />
                    </div>
                    <div className='p-5'>
                      <p className='text-xs font-extrabold uppercase text-[#FFC300]'>
                        {roomTypeLabels[String(post.roomType)] || post.roomType}
                      </p>
                      <h2 className='mt-2 line-clamp-2 text-xl font-extrabold'>{post.title}</h2>
                      <p className='mt-3 flex items-center gap-2 text-sm text-gray-500'>
                        <FaMapMarkerAlt className='text-[#FFC300]' />
                        {post.ward?.name || post.detailAddress}
                      </p>
                      <p className='mt-4 text-xl font-black text-[#003566]'>
                        {currencyFormatter.format(Number(post.price || 0))}
                      </p>
                    </div>
                  </Link>
                  <div className='border-t border-gray-100 p-5'>
                    <button
                      type='button'
                      onClick={() => void handleRemove(post.id)}
                      className='inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 px-5 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-50'
                    >
                      <FaTrash />
                      Bỏ lưu
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default FavouritePostsPage
