import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { FaCheck, FaClipboardList, FaEye, FaShieldAlt, FaSyncAlt, FaTimes, FaUsers } from 'react-icons/fa'
import { Link, useLocation } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import Pagination from '@/components/pagination/Pagination'
import adminService, {
  type AdminReport,
  type AdminReportStatus,
  type AdminPostStatistic,
  type AdminStatsPeriod,
  type HostVerificationCandidate,
  type AdminUser
} from '@/services/adminService'
import { type Post, type PostStatus } from '@/services/postService'

type AdminTab = 'overview' | 'posts' | 'users' | 'reports' | 'hosts'

type AdminDashboardPageProps = {
  activeTab: AdminTab
}

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  UPDATED: 'Cập nhật',
  HIDDEN: 'Đã ẩn',
  ACTIVE: 'Hoạt động',
  BANNED: 'Bị khóa',
  LOCKED: 'Chờ mở',
  SET_UP: 'Thiết lập'
}

const reportStatusLabels: Record<AdminReportStatus, string> = {
  PENDING: 'Chờ xử lý',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Đã từ chối',
  HIDDEN: 'Đã ẩn'
}

const adminTabs: { label: string; value: AdminTab; to: string }[] = [
  { label: 'Tổng quan', value: 'overview', to: '/admin/overview' },
  { label: 'Bài đăng', value: 'posts', to: '/admin/posts' },
  { label: 'Người dùng', value: 'users', to: '/admin/users' },
  { label: 'Báo cáo', value: 'reports', to: '/admin/reports' },
  { label: 'Xác minh', value: 'hosts', to: '/admin/hosts' }
]

const formatNumber = (value?: number) => new Intl.NumberFormat('vi-VN').format(value || 0)

const getStatusClass = (status?: string) => {
  if (status === 'APPROVED' || status === 'ACTIVE' || status === 'RESOLVED') return 'bg-green-100 text-green-700'
  if (status === 'PENDING' || status === 'UPDATED' || status === 'SET_UP') return 'bg-yellow-100 text-yellow-700'
  if (status === 'REJECTED' || status === 'BANNED') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const getPostCountByStatus = (stats: AdminPostStatistic, status: string) =>
  stats.byStatus?.find((item) => item.status === status)?.count || 0

const REPORTS_PER_PAGE = 10
const ADMIN_TABLE_PAGE_SIZE = 10
const ADMIN_POSTS_ANALYTICS_LIMIT = 1000

type ChartPoint = {
  label: string
  posts: number
  approved: number
}

type AdminPostSort = 'newest' | 'oldest' | 'statusAsc' | 'statusDesc'

const getPostDate = (post: Post) => {
  const date = post.createdAt ? new Date(post.createdAt) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const getPostsInStatsPeriod = (posts: Post[], stats: AdminPostStatistic) => {
  const since = stats.since ? new Date(stats.since) : null

  if (!since || Number.isNaN(since.getTime())) {
    return posts
  }

  return posts.filter((post) => {
    const date = getPostDate(post)
    return Boolean(date && date >= since)
  })
}

const getPostReportCount = (post: Post) => post._count?.reports || 0

const getPostStatusPriority = (post: Post) => {
  const priorities: Record<string, number> = {
    PENDING: 0,
    UPDATED: 1,
    REJECTED: 2,
    APPROVED: 3,
    HIDDEN: 4
  }

  return priorities[String(post.status)] ?? 5
}

const buildDailyChartData = (posts: Post[]): ChartPoint[] => {
  const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  const data = labels.map((label) => ({ label, posts: 0, approved: 0 }))

  posts.forEach((post) => {
    const date = getPostDate(post)
    if (!date) return

    const index = date.getDay() === 0 ? 6 : date.getDay() - 1
    data[index].posts += 1
    if (post.status === 'APPROVED') data[index].approved += 1
  })

  return data
}

const buildHourlyChartData = (posts: Post[]): ChartPoint[] => {
  const ranges = [
    { label: '0-4h', start: 0, end: 4 },
    { label: '4-8h', start: 4, end: 8 },
    { label: '8-12h', start: 8, end: 12 },
    { label: '12-16h', start: 12, end: 16 },
    { label: '16-20h', start: 16, end: 20 },
    { label: '20-24h', start: 20, end: 24 }
  ]
  const data = ranges.map((range) => ({ label: range.label, posts: 0, approved: 0 }))

  posts.forEach((post) => {
    const date = getPostDate(post)
    if (!date) return

    const hour = date.getHours()
    const index = ranges.findIndex((range) => hour >= range.start && hour < range.end)
    if (index < 0) return

    data[index].posts += 1
    if (post.status === 'APPROVED') data[index].approved += 1
  })

  return data
}

const ActivityChart = ({ title, data }: { title: string; data: ChartPoint[] }) => {
  const maxValue = Math.max(...data.flatMap((item) => [item.posts, item.approved]), 1)

  return (
    <section className='rounded-2xl bg-white p-6 shadow-lg shadow-black/15'>
      <div className='flex items-start justify-between gap-6'>
        <h2 className='text-3xl font-extrabold text-[#181A20]'>{title}</h2>
        <div className='flex items-center gap-5 text-xs font-bold text-gray-500'>
          <span className='flex items-center gap-2'>
            <span className='h-3 w-3 rounded-full bg-[#001D3D]' />
            Bài đăng
          </span>
          <span className='flex items-center gap-2'>
            <span className='h-3 w-3 rounded-full bg-[#FFC300]' />
            Đã duyệt
          </span>
        </div>
      </div>
      <div className='mt-7 flex h-64 items-end gap-4 border-y border-gray-100 px-2 py-4'>
        {data.map((item) => (
          <div key={item.label} className='flex h-full min-w-0 flex-1 flex-col justify-end'>
            <div className='flex h-full items-end justify-center gap-1'>
              <span
                className='w-4 rounded-t-md bg-[#001D3D]'
                title={`${item.posts} bài đăng`}
                style={{ height: `${Math.max(8, (item.posts / maxValue) * 100)}%` }}
              />
              <span
                className='w-4 rounded-t-md bg-[#FFC300]'
                title={`${item.approved} bài đã duyệt`}
                style={{ height: `${Math.max(8, (item.approved / maxValue) * 100)}%` }}
              />
            </div>
            <span className='mt-3 truncate text-center text-[10px] font-extrabold text-gray-400'>{item.label}</span>
          </div>
        ))}
      </div>
      <p className='mt-3 text-xs font-semibold text-gray-500'>
        Dựa trên thời điểm tạo của các bài đăng đang tải trong trang quản trị.
      </p>
    </section>
  )
}

const AdminShell = ({ activeTab, children }: AdminDashboardPageProps & { children: ReactNode }) => {
  const location = useLocation()

  return (
    <div className='min-h-screen bg-[#F4F5F7] text-[#181A20]'>
      <SiteHeader accountLabel='Admin' />
      <main className='mx-auto max-w-[1440px] px-8 py-10'>
        <div className='flex flex-wrap items-center justify-between gap-5'>
          <h1 className='text-4xl font-black tracking-wide'>TRANG THỐNG KÊ</h1>
          <nav className='flex rounded-lg bg-gray-200 p-1 text-sm font-bold shadow-inner'>
            {adminTabs.map((tab) => (
              <motion.div key={tab.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={tab.to}
                  className={`block rounded-md px-7 py-2 transition ${
                    activeTab === tab.value || location.pathname === tab.to
                      ? 'bg-white text-[#181A20] shadow-md'
                      : 'text-gray-700 hover:text-[#181A20]'
                  }`}
                >
                  {tab.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
        <AnimatePresence mode='wait'>
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
    </div>
  )
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <article className='flex min-h-40 items-center justify-between rounded-2xl bg-white px-9 py-7 shadow-lg shadow-black/20'>
    <div>
      <p className='text-2xl font-extrabold'>{label}</p>
      <p className='mt-5 text-5xl font-black text-[#F5C434]'>{formatNumber(value)}</p>
    </div>
    <FaUsers className='text-7xl text-black' />
  </article>
)

const PeriodControls = ({
  period,
  onChange
}: {
  period: AdminStatsPeriod
  onChange: (period: AdminStatsPeriod) => void
}) => (
  <section className='rounded-2xl bg-white p-5 shadow-lg shadow-black/15'>
    <div className='flex gap-4'>
      {[
        ['day', 'Hôm nay'],
        ['week', 'Tuần này'],
        ['month', 'Tháng này']
      ].map(([value, label]) => (
        <button
          key={value}
          type='button'
          onClick={() => onChange(value as AdminStatsPeriod)}
          className={`rounded-full px-6 py-3 text-sm font-bold transition ${
            period === value ? 'bg-[#F8D977] text-[#181A20]' : 'bg-[#FFE9A3] text-[#181A20] hover:bg-[#F8D977]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </section>
)

const DateFilterCard = () => (
  <section className='rounded-2xl bg-white p-6 shadow-lg shadow-black/15'>
    <label className='flex items-center justify-between gap-4 text-lg font-medium'>
      Ngày bắt đầu
      <input
        type='date'
        className='h-10 w-44 rounded-full border border-[#001D3D] px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
      />
    </label>
    <label className='mt-5 flex items-center justify-between gap-4 text-lg font-medium'>
      Ngày kết thúc
      <input
        type='date'
        className='h-10 w-44 rounded-full border border-[#001D3D] px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
      />
    </label>
  </section>
)

const RegionalStatistics = ({ posts }: { posts: Post[] }) => {
  const regionalData = useMemo(() => {
    const counts = new Map<string, number>()
    posts.forEach((post) => {
      const wardName = post.ward?.name || 'Chưa rõ'
      counts.set(wardName, (counts.get(wardName) || 0) + 1)
    })

    const total = Math.max(posts.length, 1)
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4)
  }, [posts])

  return (
    <section className='rounded-2xl bg-white p-6 shadow-lg shadow-black/15'>
      <h2 className='text-xl font-extrabold text-gray-700'>Thống kê theo khu vực</h2>
      <div className='mt-6 grid gap-5'>
        {regionalData.map((item) => (
          <div key={item.name}>
            <div className='mb-2 flex justify-between text-sm font-extrabold text-gray-600'>
              <span>{item.name}</span>
              <span>{item.percent}%</span>
            </div>
            <div className='h-2 rounded-full bg-gray-100'>
              <div className='h-full rounded-full bg-[#756309]' style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Link
        to='/admin/posts'
        className='mt-8 grid h-14 w-full place-items-center rounded-lg bg-gray-100 text-base font-extrabold text-gray-600 transition hover:bg-[#001D3D] hover:text-white'
      >
        Xem chi tiết
      </Link>
    </section>
  )
}

const OverviewContent = () => {
  const [period, setPeriod] = useState<AdminStatsPeriod>('day')
  const [stats, setStats] = useState<AdminPostStatistic>({})
  const [posts, setPosts] = useState<Post[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setErrorMessage('')
        const [statResult, postResult, userResult] = await Promise.all([
          adminService.getPostStatistics(period),
          adminService.getAdminPosts({ limit: ADMIN_POSTS_ANALYTICS_LIMIT }),
          adminService.getUsers({ limit: 5 })
        ])
        setStats(statResult)
        setPosts(postResult.data)
        setTotalUsers(userResult.meta?.total || userResult.data.length)
      } catch {
        setErrorMessage('Không tải được dữ liệu admin. Hãy đăng nhập bằng tài khoản ADMIN.')
      }
    }

    void loadOverview()
  }, [period])

  const recentFlaggedPosts = posts
    .filter((post) => getPostReportCount(post) > 0 || post.status !== 'APPROVED')
    .sort(
      (a, b) =>
        getPostReportCount(b) - getPostReportCount(a) ||
        getPostStatusPriority(a) - getPostStatusPriority(b) ||
        (getPostDate(b)?.getTime() || 0) - (getPostDate(a)?.getTime() || 0)
    )
    .slice(0, 3)
  const periodPosts = useMemo(() => getPostsInStatsPeriod(posts, stats), [posts, stats])
  const dailyChartData = useMemo(() => buildDailyChartData(periodPosts), [periodPosts])
  const hourlyChartData = useMemo(() => buildHourlyChartData(periodPosts), [periodPosts])

  return (
    <AdminShell activeTab='overview'>
      {errorMessage ? (
        <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{errorMessage}</p>
      ) : null}

      <section className='mt-12 grid gap-16 lg:grid-cols-2'>
        <StatCard label='Tổng người dùng' value={totalUsers} />
        <StatCard label='Số lượng bài đăng mới' value={stats.totalPosts || posts.length} />
      </section>

      <section className='mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='grid gap-10'>
          <ActivityChart title='Thống kê theo ngày' data={dailyChartData} />
          <ActivityChart title='Thống kê theo giờ' data={hourlyChartData} />
        </div>
        <aside className='grid content-start gap-8'>
          <PeriodControls period={period} onChange={setPeriod} />
          <DateFilterCard />
          <RegionalStatistics posts={periodPosts} />
        </aside>
      </section>

      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <div className='flex items-start justify-between gap-6'>
          <h2 className='text-3xl font-extrabold'>Gần đây - bài đăng cần xử lý</h2>
          <p className='text-sm text-gray-500'>Ưu tiên tin bị báo cáo hoặc đang chờ duyệt.</p>
        </div>
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full min-w-[760px] text-left text-sm'>
            <thead>
              <tr className='text-sm font-extrabold text-[#181A20]'>
                <th className='py-3'>Người đăng</th>
                <th className='py-3'>Trạng thái</th>
                <th className='py-3'>Bài đăng</th>
                <th className='py-3'>Báo cáo</th>
                <th className='py-3 text-right'>Quyết định</th>
              </tr>
            </thead>
            <tbody>
              {(recentFlaggedPosts.length ? recentFlaggedPosts : posts.slice(0, 3)).map((post) => (
                <tr key={post.id} className='border-t border-gray-100'>
                  <td className='py-4 font-semibold'>{post.user?.fullName || post.userId || 'Người dùng'}</td>
                  <td className='py-4'>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(post.status)}`}>
                      {statusLabels[String(post.status)] || post.status}
                    </span>
                  </td>
                  <td className='max-w-xs truncate py-4'>{post.title}</td>
                  <td className='py-4'>{getPostReportCount(post)}</td>
                  <td className='py-4 text-right'>
                    <Link to='/admin/posts' className='rounded-full bg-[#F8D977] px-5 py-2 text-xs font-extrabold'>
                      Xử lý
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

const AdminPostsContent = () => {
  const [period, setPeriod] = useState<AdminStatsPeriod>('day')
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'ALL'>('ALL')
  const [postSort, setPostSort] = useState<AdminPostSort>('newest')
  const [stats, setStats] = useState<AdminPostStatistic>({})
  const [posts, setPosts] = useState<Post[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [message, setMessage] = useState('')

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true)
    const [statResult, postResult] = await Promise.all([
      adminService.getPostStatistics(period),
      adminService.getAdminPosts({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: currentPage,
        limit: ADMIN_TABLE_PAGE_SIZE,
        sort: postSort
      })
    ])
    setStats(statResult)
    setPosts(postResult.data)
    setTotalPages(Math.max(1, postResult.meta?.totalPages || 1))
    setTotalPosts(postResult.meta?.totalItems ?? postResult.meta?.total ?? postResult.data.length)
    setLoadingPosts(false)
  }, [currentPage, period, postSort, statusFilter])

  useEffect(() => {
    void loadPosts().catch(() => {
      setLoadingPosts(false)
      setMessage('Không tải được danh sách bài đăng admin.')
    })
  }, [loadPosts])

  const handleCensor = async (postId: string, status: PostStatus) => {
    try {
      setMessage('')
      await adminService.censorPost(postId, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Không phù hợp với quy định đăng tin.' : undefined
      })
      await loadPosts()
      setMessage(status === 'APPROVED' ? 'Đã duyệt bài đăng.' : 'Đã đánh dấu vi phạm.')
    } catch {
      setMessage('Không thể cập nhật trạng thái bài đăng.')
    }
  }
  const periodPosts = useMemo(() => getPostsInStatsPeriod(posts, stats), [posts, stats])
  const dailyChartData = useMemo(() => buildDailyChartData(periodPosts), [periodPosts])
  const hourlyChartData = useMemo(() => buildHourlyChartData(periodPosts), [periodPosts])
  return (
    <AdminShell activeTab='posts'>
      {message ? (
        <p className='mt-6 rounded-xl bg-[#FFF7D6] px-5 py-3 text-sm font-bold text-[#6F5616]'>{message}</p>
      ) : null}

      <section className='mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='grid gap-8'>
          <ActivityChart title='Thống kê theo ngày' data={dailyChartData} />
          <ActivityChart title='Thống kê theo giờ' data={hourlyChartData} />
        </div>
        <aside className='grid content-start gap-8'>
          <PeriodControls period={period} onChange={setPeriod} />
          <section className='rounded-2xl bg-white p-5 shadow-lg shadow-black/15'>
            <p className='text-sm font-extrabold'>Lọc trạng thái</p>
            <div className='mt-4 grid grid-cols-2 gap-3'>
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  type='button'
                  onClick={() => {
                    setCurrentPage(1)
                    setStatusFilter(status)
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                    statusFilter === status ? 'bg-[#001D3D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {status === 'ALL' ? 'Tất cả' : statusLabels[status]}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <div className='flex flex-wrap items-start justify-between gap-5'>
          <div>
            <h2 className='text-3xl font-extrabold'>Gần đây - bài đăng vi phạm</h2>
            <p className='mt-2 text-sm text-gray-500'>
              Tổng: {formatNumber(stats.totalPosts || posts.length)} | Chờ duyệt:{' '}
              {getPostCountByStatus(stats, 'PENDING')}
            </p>
          </div>
          <div className='flex flex-wrap items-center justify-end gap-3'>
            <p className='max-w-md text-sm text-gray-500'>
              Các quyết định xử lý sẽ được ghi nhận và gửi thông báo cho người đăng.
            </p>
            <label className='flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-xs font-extrabold text-[#181A20]'>
              <span>Sắp xếp</span>
              <select
                value={postSort}
                onChange={(event) => {
                  setCurrentPage(1)
                  setPostSort(event.target.value as AdminPostSort)
                }}
                className='bg-transparent text-xs font-extrabold outline-none'
              >
                <option value='newest'>Mới nhất</option>
                <option value='oldest'>Cũ nhất</option>
                <option value='statusAsc'>Trạng thái: chờ duyệt trước</option>
                <option value='statusDesc'>Trạng thái: đảo chiều</option>
              </select>
            </label>
          </div>
        </div>
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full min-w-[980px] text-left text-sm'>
            <thead>
              <tr className='text-sm font-extrabold text-[#181A20]'>
                <th className='py-3'>Người dùng</th>
                <th className='py-3'>Trạng thái</th>
                <th className='py-3'>Bài đăng</th>
                <th className='py-3'>Khu vực</th>
                <th className='py-3'>Báo cáo</th>
                <th className='py-3 text-right'>Quyết định</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className='border-t border-gray-100'>
                  <td className='py-4 font-semibold'>{post.user?.fullName || post.userId || 'Người dùng'}</td>
                  <td className='py-4'>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(post.status)}`}>
                      {statusLabels[String(post.status)] || post.status}
                    </span>
                  </td>
                  <td className='max-w-xs truncate py-4'>{post.title}</td>
                  <td className='py-4'>{post.ward?.name || 'Chưa rõ'}</td>
                  <td className='py-4'>{getPostReportCount(post)}</td>
                  <td className='py-4'>
                    <div className='flex justify-end gap-2'>
                      <Link
                        to={`/posts/${post.id}`}
                        state={{ returnTo: '/admin/posts', returnLabel: 'Quay lại trang quản trị' }}
                        className='inline-flex items-center gap-2 rounded-full bg-[#001D3D] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#003566]'
                      >
                        <FaEye />
                        Chi tiết
                      </Link>
                      <button
                        type='button'
                        onClick={() => void handleCensor(post.id, 'REJECTED')}
                        className='inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-extrabold text-white'
                      >
                        <FaTimes />
                        Vi phạm
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleCensor(post.id, 'APPROVED')}
                        className='inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-xs font-extrabold text-white'
                      >
                        <FaCheck />
                        Duyệt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPosts > 0 ? (
          <div className='mt-6 grid gap-4 border-t border-gray-100 pt-5'>
            <p className='text-center text-sm font-semibold text-gray-500'>
              Showing {formatNumber(posts.length)} / {formatNumber(totalPosts)} posts
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              disabled={loadingPosts}
            />
          </div>
        ) : null}
      </section>
    </AdminShell>
  )
}

const AdminUsersContent = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [message, setMessage] = useState('')

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    const result = await adminService.getUsers({ page: currentPage, limit: ADMIN_TABLE_PAGE_SIZE })
    setUsers(result.data)
    setTotalPages(Math.max(1, result.meta?.totalPages || 1))
    setTotalUsers(result.meta?.totalItems ?? result.meta?.total ?? result.data.length)
    setLoadingUsers(false)
  }, [currentPage])

  useEffect(() => {
    void loadUsers().catch(() => {
      setLoadingUsers(false)
      setMessage('Không tải được danh sách người dùng admin.')
    })
  }, [loadUsers])

  const handleToggleUser = async (user: AdminUser) => {
    try {
      if (user.status === 'BANNED') {
        await adminService.unbanUser(user.id)
      } else {
        await adminService.banUser(user.id)
      }
      await loadUsers()
    } catch {
      setMessage('Không thể cập nhật trạng thái người dùng.')
    }
  }

  return (
    <AdminShell activeTab='users'>
      {message ? (
        <p className='mt-6 rounded-xl bg-[#FFF7D6] px-5 py-3 text-sm font-bold text-[#6F5616]'>{message}</p>
      ) : null}
      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <h2 className='text-3xl font-extrabold'>Người dùng</h2>
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full min-w-[900px] text-left text-sm'>
            <thead>
              <tr className='text-sm font-extrabold text-[#181A20]'>
                <th className='py-3'>Tên</th>
                <th className='py-3'>Email</th>
                <th className='py-3'>Vai trò</th>
                <th className='py-3'>Trạng thái</th>
                <th className='py-3 text-right'>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className='border-t border-gray-100'>
                  <td className='py-4 font-semibold'>{user.fullName}</td>
                  <td className='py-4 text-gray-600'>{user.email}</td>
                  <td className='py-4'>{user.roles?.[0] || 'USER'}</td>
                  <td className='py-4'>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(user.status)}`}>
                      {statusLabels[String(user.status)] || user.status}
                    </span>
                  </td>
                  <td className='py-4 text-right'>
                    <button
                      type='button'
                      onClick={() => void handleToggleUser(user)}
                      className={`rounded-full px-5 py-2 text-xs font-extrabold text-white ${
                        user.status === 'BANNED' ? 'bg-green-500' : 'bg-red-600'
                      }`}
                    >
                      {user.status === 'BANNED' ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalUsers > 0 ? (
          <div className='mt-6 grid gap-4 border-t border-gray-100 pt-5'>
            <p className='text-center text-sm font-semibold text-gray-500'>
              Showing {formatNumber(users.length)} / {formatNumber(totalUsers)} users
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              disabled={loadingUsers}
            />
          </div>
        ) : null}
      </section>
    </AdminShell>
  )
}

const AdminReportsContent = () => {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [statusFilter, setStatusFilter] = useState<AdminReportStatus | 'ALL'>('PENDING')
  const [notesByReport, setNotesByReport] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReports, setTotalReports] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processingReportId, setProcessingReportId] = useState('')
  const [message, setMessage] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    const result = await adminService.getReports({ status: statusFilter, page, limit: REPORTS_PER_PAGE })
    setReports(result.data)
    setTotalPages(Math.max(1, result.meta?.totalPages || 1))
    setTotalReports(result.meta?.totalItems ?? result.meta?.total ?? result.data.length)
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => {
    void loadReports().catch(() => {
      setLoading(false)
      setMessage('Không tải được danh sách báo cáo.')
    })
  }, [loadReports])

  const handleTackleReport = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    setProcessingReportId(reportId)
    setMessage('')

    try {
      const response = await adminService.tackleReport(reportId, {
        status,
        adminNote: notesByReport[reportId]?.trim() || undefined
      })
      setMessage(response.message || 'Đã cập nhật trạng thái báo cáo.')
      setNotesByReport((current) => ({ ...current, [reportId]: '' }))
      await loadReports()
    } catch {
      setMessage('Không thể xử lý báo cáo. Vui lòng kiểm tra quyền admin và trạng thái báo cáo.')
    } finally {
      setProcessingReportId('')
    }
  }

  return (
    <AdminShell activeTab='reports'>
      {message ? (
        <p className='mt-6 rounded-xl bg-[#FFF7D6] px-5 py-3 text-sm font-bold text-[#6F5616]'>{message}</p>
      ) : null}

      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <div className='flex flex-wrap items-start justify-between gap-5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-full bg-[#FFC300] text-[#001D3D]'>
              <FaClipboardList />
            </span>
            <div>
              <h2 className='text-3xl font-extrabold'>Danh sách báo cáo</h2>
              <p className='mt-1 text-sm font-semibold text-gray-500'>
                Theo dõi báo cáo từ người dùng và xử lý nội dung vi phạm.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {(['ALL', 'PENDING', 'RESOLVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                type='button'
                onClick={() => {
                  setPage(1)
                  setStatusFilter(status)
                }}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                  statusFilter === status ? 'bg-[#001D3D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#FFF7D6]'
                }`}
              >
                {status === 'ALL' ? 'Tất cả' : reportStatusLabels[status]}
              </button>
            ))}
            <button
              type='button'
              onClick={() => void loadReports()}
              disabled={loading}
              aria-label='Tải lại danh sách báo cáo'
              title='Tải lại'
              className='grid h-9 w-9 place-items-center rounded-full border border-[#003566] text-[#003566] transition hover:bg-[#003566] hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300'
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className='mt-8 rounded-xl bg-gray-50 px-5 py-4 text-sm font-bold text-gray-500'>
            Đang tải danh sách báo cáo...
          </p>
        ) : (
          <div className='mt-7 overflow-x-auto'>
            <table className='w-full min-w-[1120px] text-left text-sm'>
              <thead>
                <tr className='text-sm font-extrabold text-[#181A20]'>
                  <th className='py-3'>Người báo cáo</th>
                  <th className='py-3'>Người bị báo cáo</th>
                  <th className='py-3'>Nội dung</th>
                  <th className='py-3'>Lý do</th>
                  <th className='py-3'>Trạng thái</th>
                  <th className='py-3'>Ghi chú</th>
                  <th className='py-3 text-right'>Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const isPending = report.status === 'PENDING'
                  const relatedPostId = report.postId || report.comment?.postId
                  const relatedPostPath = relatedPostId ? `/posts/${relatedPostId}` : ''
                  const reportContent = report.post?.title || report.comment?.content

                  return (
                    <tr key={report.id} className='border-t border-gray-100 align-top'>
                      <td className='py-4'>
                        <p className='font-extrabold'>{report.user?.fullName || 'Người dùng'}</p>
                        <p className='mt-1 text-xs font-semibold text-gray-500'>{report.user?.email}</p>
                      </td>
                      <td className='py-4'>
                        <p className='font-extrabold'>{report.reportedUser?.fullName || 'Người dùng'}</p>
                        <p className='mt-1 text-xs font-semibold text-gray-500'>{report.reportedUser?.email}</p>
                      </td>
                      <td className='max-w-xs py-4'>
                        {reportContent && relatedPostPath ? (
                          <Link
                            to={relatedPostPath}
                            state={{ returnTo: '/admin/reports', returnLabel: 'Quay lại báo cáo' }}
                            className='line-clamp-3 font-extrabold text-[#003566] hover:underline'
                          >
                            {reportContent}
                          </Link>
                        ) : reportContent ? (
                          <p className='line-clamp-3 font-semibold text-gray-700'>{reportContent}</p>
                        ) : (
                          <span className='font-semibold text-gray-400'>Không có nội dung</span>
                        )}
                      </td>
                      <td className='max-w-xs py-4'>
                        <p className='line-clamp-3 font-semibold text-gray-600'>{report.reason}</p>
                      </td>
                      <td className='py-4'>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(report.status)}`}
                        >
                          {reportStatusLabels[report.status] || report.status}
                        </span>
                      </td>
                      <td className='py-4'>
                        {isPending ? (
                          <textarea
                            value={notesByReport[report.id] || ''}
                            onChange={(event) =>
                              setNotesByReport((current) => ({ ...current, [report.id]: event.target.value }))
                            }
                            className='h-20 w-56 resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#FFC300]'
                            placeholder='Ghi chú xử lý'
                          />
                        ) : (
                          <p className='max-w-[14rem] text-xs font-semibold text-gray-500'>
                            {report.adminNote || 'Không có ghi chú'}
                          </p>
                        )}
                      </td>
                      <td className='py-4 text-right'>
                        {isPending ? (
                          <div className='flex justify-end gap-2'>
                            <button
                              type='button'
                              onClick={() => void handleTackleReport(report.id, 'RESOLVED')}
                              disabled={processingReportId === report.id}
                              className='inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300'
                            >
                              <FaCheck />
                              Xử lý
                            </button>
                            <button
                              type='button'
                              onClick={() => void handleTackleReport(report.id, 'REJECTED')}
                              disabled={processingReportId === report.id}
                              className='inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-extrabold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-300'
                            >
                              <FaTimes />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className='text-xs font-bold text-gray-400'>Đã hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {reports.length === 0 ? (
              <p className='rounded-xl bg-gray-50 px-5 py-4 text-sm font-bold text-gray-500'>
                Không có báo cáo phù hợp.
              </p>
            ) : null}
            {totalReports > 0 ? (
              <div className='mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5'>
                <p className='text-sm font-semibold text-gray-500'>
                  Hiển thị {formatNumber(reports.length)} / {formatNumber(totalReports)} báo cáo
                </p>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
              </div>
            ) : null}
          </div>
        )}
      </section>
    </AdminShell>
  )
}

const HostVerificationCard = ({
  candidate,
  onVerify,
  loading
}: {
  candidate: HostVerificationCandidate
  onVerify: (hostId: string) => void
  loading: boolean
}) => (
  <motion.article 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.2 }}
    className='rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-black/10 transition hover:shadow-xl'
  >
    <div className='flex items-start justify-between gap-5'>
      <div className='min-w-0'>
        <h3 className='truncate text-xl font-extrabold'>{candidate.user?.fullName || 'Chủ trọ'}</h3>
        <p className='mt-1 truncate text-sm font-semibold text-gray-500'>{candidate.user?.email || 'Chưa có email'}</p>
        <p className='mt-1 text-sm font-semibold text-gray-500'>
          {candidate.user?.phone || 'Chưa cập nhật số điện thoại'}
        </p>
      </div>
      <span className='grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FFF7D6] text-[#001D3D]'>
        <FaShieldAlt />
      </span>
    </div>

    <div className='mt-5 grid grid-cols-3 gap-3 text-center text-sm'>
      <div className='rounded-xl bg-[#F5F7FA] px-3 py-3'>
        <p className='font-black text-[#001D3D]'>{candidate.totalPost || 0}</p>
        <p className='mt-1 text-xs font-bold text-gray-500'>Bài đăng</p>
      </div>
      <div className='rounded-xl bg-[#F5F7FA] px-3 py-3'>
        <p className='font-black text-[#001D3D]'>{candidate.avgStar ?? '0'}</p>
        <p className='mt-1 text-xs font-bold text-gray-500'>Đánh giá</p>
      </div>
      <div className='rounded-xl bg-[#F5F7FA] px-3 py-3'>
        <p className='font-black text-[#001D3D]'>{candidate.isVerified ? 'Có' : 'Chưa'}</p>
        <p className='mt-1 text-xs font-bold text-gray-500'>Xác minh</p>
      </div>
    </div>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type='button'
      onClick={() => onVerify(candidate.hostId)}
      disabled={loading || candidate.isVerified}
      className='mt-5 w-full rounded-full bg-[#FFC300] px-5 py-3 text-sm font-extrabold text-[#001D3D] transition hover:bg-[#FFD60A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500'
    >
      {candidate.isVerified ? 'Đã xác minh' : 'Xác minh chủ trọ'}
    </motion.button>
  </motion.article>
)

const AdminHostsContent = () => {
  const [candidates, setCandidates] = useState<HostVerificationCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingHostId, setVerifyingHostId] = useState('')
  const [message, setMessage] = useState('')

  const loadCandidates = async () => {
    setLoading(true)
    const result = await adminService.getHostVerificationCandidates({ limit: 50 })
    setCandidates(result.data)
    setLoading(false)
  }

  useEffect(() => {
    void loadCandidates().catch(() => {
      setLoading(false)
      setMessage('Không tải được danh sách chủ trọ đủ điều kiện xác minh.')
    })
  }, [])

  const handleVerifyHost = async (hostId: string) => {
    setVerifyingHostId(hostId)
    setMessage('')

    try {
      const response = await adminService.verifyHost(hostId)
      setMessage(response.message || 'Đã xác minh chủ trọ.')
      await loadCandidates()
    } catch {
      setMessage('Không thể xác minh chủ trọ. Hãy kiểm tra điều kiện đánh giá và quyền admin.')
    } finally {
      setVerifyingHostId('')
    }
  }

  return (
    <AdminShell activeTab='hosts'>
      {message ? (
        <p className='mt-6 rounded-xl bg-[#FFF7D6] px-5 py-3 text-sm font-bold text-[#6F5616]'>{message}</p>
      ) : null}

      <section className='mt-10 rounded-2xl bg-white p-7 shadow-lg shadow-black/15'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h2 className='text-3xl font-extrabold'>Xác minh chủ trọ</h2>
            <p className='mt-2 text-sm font-semibold text-gray-500'>
              Duyệt các chủ trọ đủ điều kiện để hiển thị trạng thái đã xác minh.
            </p>
          </div>
          <button
            type='button'
            onClick={() => void loadCandidates()}
            disabled={loading}
            aria-label='Tải lại danh sách xác minh'
            title='Tải lại'
            className='grid h-10 w-10 place-items-center rounded-full border border-[#003566] text-[#003566] transition hover:bg-[#003566] hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300'
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <p className='mt-8 rounded-xl bg-gray-50 px-5 py-4 text-sm font-bold text-gray-500'>
            Đang tải danh sách xác minh...
          </p>
        ) : candidates.length > 0 ? (
          <div className='mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {candidates.map((candidate) => (
              <HostVerificationCard
                key={candidate.hostId}
                candidate={candidate}
                loading={verifyingHostId === candidate.hostId}
                onVerify={(hostId) => void handleVerifyHost(hostId)}
              />
            ))}
          </div>
        ) : (
          <p className='mt-8 rounded-xl bg-gray-50 px-5 py-4 text-sm font-bold text-gray-500'>
            Chưa có chủ trọ nào đủ điều kiện xác minh.
          </p>
        )}
      </section>
    </AdminShell>
  )
}

export const AdminOverviewPage = () => <OverviewContent />
export const AdminPostsPage = () => <AdminPostsContent />
export const AdminUsersPage = () => <AdminUsersContent />
export const AdminReportsPage = () => <AdminReportsContent />
export const AdminHostsPage = () => <AdminHostsContent />
