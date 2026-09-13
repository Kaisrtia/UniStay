import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { FaBan, FaMapMarkerAlt, FaSpinner, FaStar, FaUniversity, FaUserCircle } from 'react-icons/fa'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import postService, { type Post } from '@/services/postService'
import userService, { type HostReview, type UserProfile } from '@/services/userService'

const USER_POSTS_LIMIT = 6

const getStoredUserId = () => {
  try {
    const rawUser = localStorage.getItem('authUser')
    return rawUser ? (JSON.parse(rawUser) as { id?: string }).id : undefined
  } catch {
    return undefined
  }
}

const roleLabels: Record<string, string> = {
  STUDENT: 'Sinh viên',
  HOST: 'Chủ trọ',
  ADMIN: 'Quản trị viên',
  USER: 'Người dùng'
}

const roomTypeLabels: Record<string, string> = {
  ROOM: 'Trọ',
  HOUSE: 'Nhà nguyên căn',
  APARTMENT: 'Chung cư'
}

const formatDate = (value?: string) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const formatPrice = (value?: string | number) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 'Liên hệ'

  return new Intl.NumberFormat('vi-VN').format(numericValue)
}

const getPostAddress = (post: Post) => {
  const parts = [post.exactAddress || post.detailAddress, post.ward?.name, post.city].filter(Boolean)
  return parts.join(', ')
}

const getAverageRating = (profile: UserProfile) => {
  const hostRating = profile.host?.avgStar
  const numericHostRating = Number(hostRating)

  if (Number.isFinite(numericHostRating) && numericHostRating >= 0) {
    return numericHostRating
  }

  const reviews = profile.reviews || []
  if (reviews.length === 0) return null

  return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
}

const ReviewStars = ({ rating }: { rating: number }) => (
  <span className='inline-flex items-center gap-1 text-[#FFC300]'>
    {Array.from({ length: 5 }, (_, index) => (
      <FaStar key={index} className={index < rating ? 'text-[#FFC300]' : 'text-gray-300'} />
    ))}
  </span>
)

const ReviewCard = ({ review }: { review: HostReview }) => (
  <article className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-[#001D3D]/5'>
    <div className='flex items-start gap-3'>
      <div className='grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#001D3D] text-white'>
        {review.reviewer?.avatarUrl ? (
          <img
            src={review.reviewer.avatarUrl}
            alt={review.reviewer.fullName || 'Người đánh giá'}
            className='h-full w-full object-cover'
          />
        ) : (
          <FaUserCircle className='text-2xl text-[#FFC300]' />
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='font-black text-gray-950'>{review.reviewer?.fullName || 'Người dùng UniStay'}</h3>
          {review.createdAt ? (
            <span className='text-xs font-bold text-gray-400'>{formatDate(review.createdAt)}</span>
          ) : null}
        </div>
        <div className='mt-2'>
          <ReviewStars rating={Number(review.rating)} />
        </div>
        <p className='mt-3 whitespace-pre-line text-sm leading-6 text-gray-700'>{review.comment}</p>
      </div>
    </div>
  </article>
)

const UserPostCard = ({ post }: { post: Post }) => {
  const imageUrl = post.postImages?.[0]?.imageUrl

  return (
    <Link
      to={`/posts/${post.id}`}
      className='group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-[#001D3D]/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#001D3D]/10'
    >
      <div className='aspect-[4/3] bg-[#F5F7FA]'>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={post.title}
            className='h-full w-full object-cover transition group-hover:scale-105'
          />
        ) : (
          <div className='grid h-full place-items-center text-4xl text-[#001D3D]/25'>
            <FaUserCircle />
          </div>
        )}
      </div>
      <div className='grid gap-3 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <span className='rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-extrabold text-[#7A5A00]'>
            {roomTypeLabels[String(post.roomType || '')] || 'Bài đăng'}
          </span>
          {post.createdAt ? (
            <span className='text-xs font-bold text-gray-400'>{formatDate(post.createdAt)}</span>
          ) : null}
        </div>
        <h3 className='line-clamp-2 text-base font-black leading-6 text-gray-950'>{post.title}</h3>
        <p className='line-clamp-1 text-sm font-semibold text-gray-500'>
          <FaMapMarkerAlt className='mr-1 inline text-[#FFC300]' />
          {getPostAddress(post)}
        </p>
        <p className='text-xl font-black text-[#FF5A3C]'>{formatPrice(post.price)} đ/tháng</p>
      </div>
    </Link>
  )
}

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [postsPage, setPostsPage] = useState(1)
  const [postsTotalPages, setPostsTotalPages] = useState(1)
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')
  const currentUserId = useMemo(() => getStoredUserId(), [])

  const isSelf = Boolean(currentUserId && currentUserId === id)
  const role = profile?.role || 'USER'
  const isStudent = role === 'STUDENT'
  const isHost = role === 'HOST'
  const averageRating = profile ? getAverageRating(profile) : null
  const reviews = profile?.reviews || []
  const canLoadMorePosts = postsPage < postsTotalPages

  const loadUserPosts = useCallback(
    async (page: number, replace = false) => {
      if (!id || isSelf) return

      try {
        setPostsLoading(true)
        setPostsError('')
        const result = await postService.getPosts({
          userId: id,
          page,
          limit: USER_POSTS_LIMIT,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })

        setUserPosts((current) => (replace ? result.data : [...current, ...result.data]))
        setPostsPage(result.meta?.page || page)
        setPostsTotalPages(result.meta?.totalPages || 1)
      } catch {
        setPostsError('Không thể tải danh sách bài đăng của người dùng này.')
      } finally {
        setPostsLoading(false)
      }
    },
    [id, isSelf]
  )

  useEffect(() => {
    if (!id) return

    let mounted = true

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await userService.getUserProfile(id)
        if (mounted) setProfile(data || null)
      } catch {
        if (mounted) setError('Không thể tải thông tin người dùng.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    setUserPosts([])
    setPostsPage(1)
    setPostsTotalPages(1)
    setPostsError('')

    if (id && !isSelf) {
      void loadUserPosts(1, true)
    }
  }, [id, isSelf, loadUserPosts])

  const handleBlockUser = async () => {
    if (!id || isSelf) return

    if (!localStorage.getItem('accessToken')) {
      setError('Vui lòng đăng nhập để chặn người dùng.')
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn chặn ${profile?.fullName || 'người dùng này'}?`)) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await userService.blockUser(id)
      navigate('/home', { replace: true })
    } catch {
      setError('Không thể chặn người dùng. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!id || !isHost || isSelf) return
    if (!comment.trim()) {
      setError('Vui lòng nhập nội dung đánh giá.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setMessage('')
      await userService.createHostReview(id, { rating, comment: comment.trim() })
      const refreshedProfile = await userService.getUserProfile(id)
      setProfile(refreshedProfile || null)
      setComment('')
      setRating(5)
      setMessage('Đã gửi đánh giá.')
    } catch {
      setError('Không thể gửi đánh giá. Vui lòng đăng nhập và thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />

      <main className='mx-auto max-w-6xl px-6 py-10'>
        {loading ? (
          <div className='grid min-h-[360px] place-items-center rounded-2xl bg-white shadow-lg shadow-[#001D3D]/5'>
            <FaSpinner className='animate-spin text-4xl text-[#001D3D]' aria-label='Đang tải' />
          </div>
        ) : error && !profile ? (
          <section className='rounded-2xl bg-white p-8 text-center shadow-lg shadow-[#001D3D]/5'>
            <h1 className='text-2xl font-black text-gray-950'>Không thể hiển thị hồ sơ</h1>
            <p className='mt-2 font-semibold text-gray-500'>{error}</p>
            <Link
              to='/home'
              className='mt-6 inline-flex rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white'
            >
              Về trang chủ
            </Link>
          </section>
        ) : profile ? (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className='grid gap-6'
            >
              <section className='overflow-hidden rounded-2xl bg-white shadow-lg shadow-[#001D3D]/5'>
              <div className='h-36 bg-gradient-to-br from-[#001D3D] via-[#003566] to-[#0D63C2]' />
              <div className='px-6 pb-6'>
                <div className='-mt-8 flex flex-wrap items-end justify-between gap-5'>
                  <div className='flex items-end gap-5'>
                    <div className='grid h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-[#001D3D] text-5xl text-[#FFC300] shadow-lg shadow-[#001D3D]/15'>
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.fullName} className='h-full w-full object-cover' />
                      ) : (
                        <FaUserCircle className='m-auto' />
                      )}
                    </div>
                    <div className='pb-2'>
                      <h1 className='text-3xl font-black text-gray-950'>{profile.fullName}</h1>
                      <div className='mt-2 flex flex-wrap items-center gap-3 text-sm font-bold text-gray-500'>
                        <span>{roleLabels[role] || role || 'Người dùng'}</span>
                        {isHost && averageRating !== null ? (
                          <span className='inline-flex items-center gap-1 text-[#001D3D]'>
                            <FaStar className='text-[#FFC300]' />
                            {averageRating.toFixed(1)} sao
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {!isSelf ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type='button'
                      disabled={submitting}
                      onClick={handleBlockUser}
                      className='inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70'
                    >
                      <FaBan />
                      Chặn người dùng
                    </motion.button>
                  ) : null}
                </div>

                <div className='mt-6 grid gap-4 md:grid-cols-2'>
                  {isStudent ? (
                    <div className='rounded-2xl bg-[#F5F7FA] p-5'>
                      <p className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Trường Đại học</p>
                      <p className='mt-2 flex items-center gap-2 font-black text-[#001D3D]'>
                        <FaUniversity className='text-[#FFC300]' />
                        {profile.student?.university?.name || 'Chưa cập nhật'}
                      </p>
                    </div>
                  ) : null}

                  {isHost ? (
                    <div className='rounded-2xl bg-[#FFF7D6] p-5'>
                      <p className='text-xs font-extrabold uppercase tracking-wide text-[#7A5A00]'>Số sao trung bình</p>
                      <p className='mt-2 flex items-center gap-2 text-2xl font-black text-[#001D3D]'>
                        <FaStar className='text-[#FFC300]' />
                        {averageRating === null ? 'Chưa có đánh giá' : `${averageRating.toFixed(1)} sao`}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {message ? (
              <p className='rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p>
            ) : null}
            {error && profile ? (
              <p className='rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p>
            ) : null}

            {isHost ? (
              <section className='rounded-2xl bg-white p-6 shadow-lg shadow-[#001D3D]/5'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  <div>
                    <h2 className='text-2xl font-black text-gray-950'>Đánh giá Host</h2>
                    <p className='mt-1 text-sm font-semibold text-gray-500'>
                      {reviews.length} đánh giá từ người dùng UniStay
                    </p>
                  </div>
                  {averageRating !== null ? <ReviewStars rating={Math.round(averageRating)} /> : null}
                </div>

                {!isSelf ? (
                  <form onSubmit={handleSubmitReview} className='mt-6 grid gap-4 rounded-2xl bg-[#F5F7FA] p-5'>
                    <label className='grid gap-2 text-sm font-extrabold text-gray-800'>
                      Số sao
                      <select
                        value={rating}
                        onChange={(event) => setRating(Number(event.target.value))}
                        className='h-12 rounded-xl border border-gray-200 bg-white px-4 outline-none focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>
                            {value} sao
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className='grid gap-2 text-sm font-extrabold text-gray-800'>
                      Nội dung đánh giá
                      <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        className='min-h-28 resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                        placeholder='Chia sẻ trải nghiệm thực tế của bạn...'
                      />
                    </label>
                    <div className='flex justify-end'>
                      <button
                        type='submit'
                        disabled={submitting}
                        className='rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:opacity-70'
                      >
                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className='mt-6 grid gap-4 md:grid-cols-2'>
                  {reviews.length > 0 ? (
                    reviews.map((review) => <ReviewCard key={review.id} review={review} />)
                  ) : (
                    <div className='rounded-2xl bg-gray-50 p-6 text-sm font-semibold text-gray-500'>
                      Host này chưa có đánh giá.
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            <section className='rounded-2xl bg-white p-6 shadow-lg shadow-[#001D3D]/5'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <h2 className='text-2xl font-black text-gray-950'>Bài đăng của người dùng</h2>
                  <p className='mt-1 text-sm font-semibold text-gray-500'>
                    {isSelf ? 'Quản lý bài đăng của bạn tại trang riêng.' : 'Các bài đăng công khai đang hiển thị.'}
                  </p>
                </div>
              </div>

              {isSelf ? (
                <div className='mt-6 rounded-2xl bg-[#F5F7FA] p-6'>
                  <p className='text-sm font-semibold text-gray-600'>
                    Đây là hồ sơ của bạn. Danh sách bài đăng cá nhân được quản lý tại trang riêng để xem cả bài đang chờ
                    duyệt hoặc đã ẩn.
                  </p>
                  <Link
                    to='/posts/me'
                    className='mt-4 inline-flex rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566]'
                  >
                    Đến trang bài đăng của tôi
                  </Link>
                </div>
              ) : (
                <div className='mt-6 grid gap-5'>
                  {postsError ? (
                    <p className='rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{postsError}</p>
                  ) : null}

                  {userPosts.length > 0 ? (
                    <motion.div layout className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                      <AnimatePresence>
                        {userPosts.map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <UserPostCard post={post} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ) : !postsLoading ? (
                    <div className='rounded-2xl bg-gray-50 p-6 text-sm font-semibold text-gray-500'>
                      Người dùng này chưa có bài đăng công khai.
                    </div>
                  ) : null}

                  {postsLoading ? (
                    <div className='grid place-items-center py-3'>
                      <FaSpinner className='animate-spin text-2xl text-[#001D3D]' aria-label='Đang tải bài đăng' />
                    </div>
                  ) : null}

                  {canLoadMorePosts ? (
                    <div className='flex justify-center'>
                      <button
                        type='button'
                        onClick={() => loadUserPosts(postsPage + 1)}
                        disabled={postsLoading}
                        className='rounded-full border border-[#001D3D] px-6 py-3 text-sm font-extrabold text-[#001D3D] transition hover:bg-[#001D3D] hover:text-white disabled:cursor-not-allowed disabled:opacity-70'
                      >
                        Tải thêm bài đăng
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </motion.div>
        </AnimatePresence>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}

export default UserDetailPage
