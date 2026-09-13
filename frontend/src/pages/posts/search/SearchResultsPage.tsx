import { useEffect, useMemo, useState } from 'react'

import { motion } from 'framer-motion'

import { FaArrowLeft, FaBath, FaBed, FaBolt, FaMapMarkerAlt, FaRulerCombined } from 'react-icons/fa'
import { Link, useSearchParams } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import Pagination from '@/components/pagination/Pagination'
import postService, { type MatchLevel, type Post, type PostFilters, type PostPurpose, type RoomType } from '@/services/postService'

type ResultTab = 'all' | PostPurpose | 'recommended'

const POSTS_PER_PAGE = 24

const tabs: { label: string; value: ResultTab }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Cho thuê', value: 'RENT' },
  { label: 'Ở ghép', value: 'FIND_ROOMMATE' },
  { label: 'Gợi ý cho tôi', value: 'recommended' }
]

const matchLevelOptions: { label: string; value: MatchLevel }[] = [
  { label: 'Mặc định (Low)', value: 'LOW' },
  { label: 'Trung bình (Medium)', value: 'MEDIUM' },
  { label: 'Cao (High)', value: 'HIGH' }
]

const fallbackImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=640&q=80'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const roomTypeLabel: Record<string, string> = {
  ROOM: 'Phòng trọ',
  APARTMENT: 'Căn hộ',
  HOUSE: 'Nhà nguyên căn'
}

const formatCurrency = (value: string | number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? currencyFormatter.format(numberValue) : `${value}`
}

const getPostImage = (post: Post) => post.postImages?.[0]?.imageUrl || fallbackImage

const getPostAddress = (post: Post) => {
  const wardName = post.ward?.name
  return wardName ? `${post.detailAddress}, ${wardName}` : post.detailAddress
}

const parseNumberParam = (value: string | null) => {
  if (!value) {
    return undefined
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

const isPostPurpose = (value: string | null): value is PostPurpose => {
  return value === 'RENT' || value === 'FIND_ROOMMATE'
}

const isRoomType = (value: string | null): value is RoomType => {
  return value === 'ROOM' || value === 'APARTMENT' || value === 'HOUSE'
}

const isSortBy = (value: string | null): value is NonNullable<PostFilters['sortBy']> => {
  return value === 'createdAt' || value === 'price' || value === 'area' || value === 'viewCount'
}

const isSortOrder = (value: string | null): value is NonNullable<PostFilters['sortOrder']> => {
  return value === 'asc' || value === 'desc'
}

const SearchResultCard = ({ post, index }: { post: Post; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
  >
    <Link to={`/posts/${post.id}`} className='group block rounded-xl bg-white p-3 shadow-sm transition hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-[#003566]/10'>
      <article>
        <div className='relative h-44 overflow-hidden rounded-md bg-gray-100'>
          <img
            src={getPostImage(post)}
            alt={post.title}
            className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
          />
          {post.user?.hosts?.some((host) => host.isVerified) && (
            <span className='absolute left-4 top-4 flex items-center gap-1 rounded bg-[#F2765B] px-3 py-1.5 text-xs font-extrabold text-white'>
              <FaBolt className='text-[10px]' />
              Đã xác thực
            </span>
          )}
        </div>

        <div className='mt-4 px-1 pb-2'>
          <p className='text-sm font-extrabold text-[#181A20]'>{formatCurrency(post.price)}</p>
          <h3 className='mt-2 line-clamp-1 text-base font-extrabold text-[#181A20] transition group-hover:text-[#003566]'>{post.title}</h3>
          <p className='mt-1 flex items-center gap-1 text-xs font-medium text-gray-500'>
            <FaMapMarkerAlt className='text-[#FFC300]' />
            {getPostAddress(post)}
          </p>
          <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-gray-600'>
            <span className='flex items-center gap-1'>
              <FaBed />
              {roomTypeLabel[String(post.roomType)] || post.roomType || 'Phòng'}
            </span>
            <span className='flex items-center gap-1'>
              <FaBath />
              {post._count?.comments ?? 0} bình luận
            </span>
            <span className='flex items-center gap-1'>
              <FaRulerCombined />
              {post.area}m²
            </span>
          </div>
        </div>
      </article>
    </Link>
  </motion.div>
)

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<ResultTab>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [matchLevel, setMatchLevel] = useState<MatchLevel>('LOW')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const queryFilters = useMemo<PostFilters>(() => {
    const purposeParam = searchParams.get('purpose')
    const roomTypeParam = searchParams.get('roomType')
    const sortByParam = searchParams.get('sortBy')
    const sortOrderParam = searchParams.get('sortOrder')
    const amenities = searchParams
      .get('amenities')
      ?.split(',')
      .map(Number)
      .filter((value) => Number.isFinite(value))

    return {
      wardId: parseNumberParam(searchParams.get('wardId')),
      keyword: searchParams.get('keyword')?.trim() || undefined,
      purpose: isPostPurpose(purposeParam) ? purposeParam : undefined,
      roomType: isRoomType(roomTypeParam) ? roomTypeParam : undefined,
      minArea: parseNumberParam(searchParams.get('minArea')),
      maxArea: parseNumberParam(searchParams.get('maxArea')),
      minPrice: parseNumberParam(searchParams.get('minPrice')),
      maxPrice: parseNumberParam(searchParams.get('maxPrice')),
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
      sortBy: isSortBy(sortByParam) ? sortByParam : 'createdAt',
      sortOrder: isSortOrder(sortOrderParam) ? sortOrderParam : 'desc'
    }
  }, [searchParams])

  useEffect(() => {
    const purpose = searchParams.get('purpose')
    setActiveTab(isPostPurpose(purpose) ? purpose : 'all')
    setCurrentPage(1)
  }, [searchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [queryFilters])

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const result =
          activeTab === 'recommended'
            ? await postService.getRecommendedPosts({ page: currentPage, limit: POSTS_PER_PAGE, level: matchLevel })
            : await postService.getPosts({
                ...queryFilters,
                purpose: activeTab === 'all' ? undefined : activeTab,
                page: currentPage,
                limit: POSTS_PER_PAGE,
                sortBy: queryFilters.sortBy || 'createdAt',
                sortOrder: queryFilters.sortOrder || 'desc'
              })

        const nextTotalPages = Math.max(1, result.meta?.totalPages || 1)

        setPosts(result.data)
        setTotalPages(nextTotalPages)
        setTotalItems(result.meta?.totalItems ?? result.meta?.total ?? result.data.length)

        if (currentPage > nextTotalPages) {
          setCurrentPage(nextTotalPages)
        }
      } catch {
        setErrorMessage(
          activeTab === 'recommended'
            ? 'Không tải được gợi ý. Hãy đăng nhập bằng tài khoản sinh viên và tạo nhu cầu thuê phòng.'
            : 'Không tải được danh sách bài đăng.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadPosts()
  }, [activeTab, currentPage, matchLevel, queryFilters])

  const content = useMemo(() => {
    if (loading) {
      return <p className='py-12 text-center text-sm font-semibold text-gray-500'>Đang tải danh sách bài đăng...</p>
    }

    if (errorMessage) {
      return <p className='py-12 text-center text-sm font-semibold text-red-500'>{errorMessage}</p>
    }

    if (posts.length === 0) {
      return <p className='py-12 text-center text-sm font-semibold text-gray-500'>Chưa có bài đăng phù hợp.</p>
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.3 }}
        className='grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4'
      >
        {posts.map((post, index) => (
          <SearchResultCard key={post.id} post={post} index={index} />
        ))}
      </motion.div>
    )
  }, [errorMessage, loading, posts])

  return (
    <div className='min-h-screen bg-[#E7E5E1] text-[#181A20]'>
      <SiteHeader />

      <main className='px-8 py-10'>
        <div className='mx-auto mb-6 max-w-7xl'>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='inline-block'>
            <Link
              to='/home'
              aria-label='Quay lại trang chủ'
              title='Quay lại trang chủ'
              className='inline-grid h-10 w-10 place-items-center rounded-full border border-[#003566] bg-white text-sm font-extrabold text-[#003566] shadow-sm transition hover:bg-[#003566] hover:text-white'
            >
              <FaArrowLeft />
            </Link>
          </motion.div>
        </div>
        <section className='mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-5 border-b border-gray-200 px-12 pt-8'>
            <div className='flex flex-wrap items-center gap-9'>
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type='button'
                  onClick={() => {
                    setCurrentPage(1)
                    setActiveTab(tab.value)
                  }}
                  className={`relative pb-5 text-lg font-extrabold transition ${
                    activeTab === tab.value ? 'text-[#181A20]' : 'text-[#181A20]/70 hover:text-[#181A20]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.value && (
                    <motion.span 
                      layoutId="searchTabIndicator"
                      className='absolute bottom-0 left-0 h-1 w-full bg-[#FFC300]' 
                    />
                  )}
                </button>
              ))}
            </div>

            <label className='mb-5 grid gap-1 text-xs font-extrabold text-[#181A20]'>
              Mức độ phù hợp
              <select
                value={matchLevel}
                onChange={(event) => {
                  setCurrentPage(1)
                  setMatchLevel(event.target.value as MatchLevel)
                }}
                className='h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFC300]'
              >
                {matchLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className='px-12 py-12'>
            {content}

            {!loading && !errorMessage && posts.length > 0 ? (
              <div className='mt-10 grid gap-4 border-t border-gray-100 pt-8'>
                <p className='text-center text-sm font-semibold text-gray-500'>
                  Hiển thị {posts.length} trong tổng số {totalItems} bài đăng
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  disabled={loading}
                />
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default SearchResultsPage
