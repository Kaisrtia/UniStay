import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'

import {
  FaBars,
  FaBan,
  FaBell,
  FaChevronDown,
  FaHeart,
  FaHome,
  FaKey,
  FaListAlt,
  FaPlusCircle,
  FaSearch,
  FaSlidersH,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaUsers
} from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'

import { logo } from '@/assets/images'
import { defaultAmenityNames, defaultBenefitNames } from '@/constants/rentalFeatures'
import amenityService, { type Amenity } from '@/services/amenityService'
import authService, { type AuthUser } from '@/services/authService'
import locationService, { type Ward } from '@/services/locationService'
import notificationService, { type AppNotification } from '@/services/notificationService'
import { type PostPurpose, type RoomType } from '@/services/postService'
import { clearAuthSession } from '@/utils/authSession'

type SiteHeaderProps = {
  accountLabel?: string
}

type FilterSelectProps = {
  label: string
  options?: Array<SelectOption | string>
  value?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
}

type FilterChipProps = {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
}

type SelectOption = {
  label: string
  value: string
}

type AdvancedFilterState = {
  wardId: string
  purpose: '' | PostPurpose
  roomType: '' | RoomType
  minPrice: string
  maxPrice: string
  minArea: string
  amenityIds: number[]
  benefits: string[]
  keyword: string
  sort: string
}

type HeaderUser = AuthUser & {
  fullName?: string
  email?: string
  avatarUrl?: string | null
  roles?: string[]
}

const benefits = defaultBenefitNames

const defaultAdvancedFilters: AdvancedFilterState = {
  wardId: '',
  purpose: '',
  roomType: '',
  minPrice: '',
  maxPrice: '',
  minArea: '',
  amenityIds: [],
  benefits: [],
  keyword: '',
  sort: 'createdAt-desc'
}

const roomTypeOptions: SelectOption[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Trọ', value: 'ROOM' },
  { label: 'Nhà nguyên căn', value: 'HOUSE' },
  { label: 'Chung cư', value: 'APARTMENT' }
]

const listingTypeOptions: SelectOption[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Cho thuê', value: 'RENT' },
  { label: 'Cho ở ghép', value: 'FIND_ROOMMATE' }
]

const sortOptions: SelectOption[] = [
  { label: 'Tin mới nhất', value: 'createdAt-desc' },
  { label: 'Giá thấp đến cao', value: 'price-asc' },
  { label: 'Giá cao đến thấp', value: 'price-desc' },
  { label: 'Diện tích lớn nhất', value: 'area-desc' }
]

const fallbackAmenities: Amenity[] = defaultAmenityNames.map((name, index) => ({
  id: index + 1,
  name
}))

const parseStoredUser = (): HeaderUser | null => {
  const rawUser = localStorage.getItem('authUser')

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as HeaderUser
  } catch {
    localStorage.removeItem('authUser')
    return null
  }
}

const formatNotificationTime = (value?: string) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  }).format(date)
}

const getNotificationPostPath = (notification: AppNotification) => {
  const postId = notification.metaData?.postId
  return typeof postId === 'string' && postId ? `/posts/${postId}` : null
}

const getInitials = (name?: string, email?: string) => {
  const source = name || email || 'U'
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

const HeaderAvatar = ({
  avatarUrl,
  initials,
  className
}: {
  avatarUrl?: string | null
  initials: string
  className: string
}) => (
  <span className={`${className} overflow-hidden rounded-full bg-[#FFC300] text-[#001D3D]`}>
    {avatarUrl ? (
      <img src={avatarUrl} alt='Ảnh đại diện' className='h-full w-full object-cover' />
    ) : (
      <span>{initials}</span>
    )}
  </span>
)

const FilterSelect = ({
  label,
  options = [{ label: 'Tất cả', value: '' }],
  value,
  onChange,
  disabled
}: FilterSelectProps) => {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option === 'Tất cả' ? '' : option } : option
  )

  return (
    <label className='block'>
      <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>{label}</span>
      <span className='relative mt-2 block'>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className='h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-[#181A20] outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30 disabled:bg-gray-50 disabled:text-gray-500'
        >
          {normalizedOptions.map((option) => (
            <option key={option.value || option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FaChevronDown className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400' />
      </span>
    </label>
  )
}

const FilterChip = ({ children, selected = false, onClick }: FilterChipProps) => (
  <button
    type='button'
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
      selected
        ? 'border-[#FFC300] bg-[#FFF1B8] text-[#6F5616]'
        : 'border-gray-200 bg-white text-gray-600 hover:border-[#FFC300] hover:text-[#6F5616]'
    }`}
  >
    {children}
  </button>
)

const formatPriceChip = (minPrice: string, maxPrice: string) => {
  if (minPrice && maxPrice) {
    return `${Number(minPrice).toLocaleString('vi-VN')} - ${Number(maxPrice).toLocaleString('vi-VN')}đ`
  }

  if (minPrice) {
    return `Từ ${Number(minPrice).toLocaleString('vi-VN')}đ`
  }

  if (maxPrice) {
    return `Đến ${Number(maxPrice).toLocaleString('vi-VN')}đ`
  }

  return ''
}

const getSelectedLabel = (options: SelectOption[], value: string) => {
  return options.find((option) => option.value === value)?.label
}

const AdvancedFilterPanel = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<AdvancedFilterState>(defaultAdvancedFilters)
  const [wards, setWards] = useState<Ward[]>([])
  const [amenityOptions, setAmenityOptions] = useState<Amenity[]>(fallbackAmenities)

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [wardData, amenityData] = await Promise.all([locationService.getWards(), amenityService.getAmenities()])
        setWards(wardData)
        setAmenityOptions(amenityData.length > 0 ? amenityData : fallbackAmenities)
      } catch {
        setAmenityOptions(fallbackAmenities)
      }
    }

    void loadFilterOptions()
  }, [])

  const updateFilter = <K extends keyof AdvancedFilterState>(key: K, value: AdvancedFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const toggleAmenity = (amenityId: number) => {
    setFilters((current) => ({
      ...current,
      amenityIds: current.amenityIds.includes(amenityId)
        ? current.amenityIds.filter((id) => id !== amenityId)
        : [...current.amenityIds, amenityId]
    }))
  }

  const toggleBenefit = (benefit: string) => {
    setFilters((current) => ({
      ...current,
      benefits: current.benefits.includes(benefit)
        ? current.benefits.filter((item) => item !== benefit)
        : [...current.benefits, benefit]
    }))
  }

  const wardOptions: SelectOption[] = [
    { label: 'Tất cả', value: '' },
    ...wards.map((ward) => ({ label: ward.name, value: String(ward.id) }))
  ]

  const selectedWardLabel = getSelectedLabel(wardOptions, filters.wardId)
  const selectedPriceLabel = formatPriceChip(filters.minPrice, filters.maxPrice)
  const selectedChips = [
    selectedWardLabel && selectedWardLabel !== 'Tất cả' ? selectedWardLabel : '',
    getSelectedLabel(roomTypeOptions, filters.roomType),
    getSelectedLabel(listingTypeOptions, filters.purpose),
    selectedPriceLabel,
    filters.minArea ? `Từ ${filters.minArea}m²` : '',
    ...amenityOptions.filter((amenity) => filters.amenityIds.includes(amenity.id)).map((amenity) => amenity.name),
    ...filters.benefits,
    filters.keyword.trim() ? `"${filters.keyword.trim()}"` : ''
  ].filter(Boolean)

  const handleSearch = () => {
    const params = new URLSearchParams()
    const [sortBy, sortOrder] = filters.sort.split('-')

    if (filters.wardId) params.set('wardId', filters.wardId)
    if (filters.purpose) params.set('purpose', filters.purpose)
    if (filters.roomType) params.set('roomType', filters.roomType)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.minArea) params.set('minArea', filters.minArea)
    if (filters.amenityIds.length > 0) params.set('amenities', filters.amenityIds.join(','))
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim())
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('sortOrder', sortOrder)

    onClose()
    navigate(`/posts/search?${params.toString()}`)
  }

  return (
    <div className='absolute left-1/2 top-16 z-50 w-[min(92vw,760px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
      <div className='flex h-14 items-center justify-between border-b border-gray-100 px-5'>
        <button
          type='button'
          onClick={onClose}
          className='grid h-9 w-9 place-items-center rounded-full hover:bg-gray-100'
        >
          <FaTimes className='text-sm' />
        </button>
        <h2 className='text-lg font-extrabold'>Bộ lọc</h2>
        <span className='h-9 w-9' />
      </div>

      <div className='max-h-[72vh] overflow-y-auto px-6 py-5'>
        <section>
          <p className='text-sm font-extrabold'>Đã chọn</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {selectedChips.length > 0 ? (
              selectedChips.map((chip) => (
                <FilterChip key={chip} selected>
                  {chip}
                </FilterChip>
              ))
            ) : (
              <span className='text-sm font-semibold text-gray-500'>Chưa chọn bộ lọc nào.</span>
            )}
          </div>
        </section>

        <section className='mt-6 border-t border-gray-100 pt-6'>
          <h3 className='text-base font-extrabold'>Khu vực</h3>
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <FilterSelect
              label='Tỉnh / Thành'
              options={[{ label: 'Đà Nẵng', value: 'da-nang' }]}
              value='da-nang'
              disabled
            />
            <FilterSelect
              label='Phường / Xã'
              options={wardOptions}
              value={filters.wardId}
              onChange={(event) => updateFilter('wardId', event.target.value)}
            />
          </div>
        </section>

        <section className='mt-6 border-t border-gray-100 pt-6'>
          <h3 className='text-base font-extrabold'>Loại tin</h3>
          <div className='mt-4 grid gap-4 md:grid-cols-3'>
            <FilterSelect
              label='Loại phòng'
              options={roomTypeOptions}
              value={filters.roomType}
              onChange={(event) => updateFilter('roomType', event.target.value as AdvancedFilterState['roomType'])}
            />
            <FilterSelect
              label='Loại tin'
              options={listingTypeOptions}
              value={filters.purpose}
              onChange={(event) => updateFilter('purpose', event.target.value as AdvancedFilterState['purpose'])}
            />
          </div>
        </section>

        <section className='mt-6 border-t border-gray-100 pt-6'>
          <h3 className='text-base font-extrabold'>Giá thuê và đặc điểm</h3>
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <label className='block'>
              <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Tối thiểu</span>
              <input
                type='number'
                min='0'
                value={filters.minPrice}
                onChange={(event) => updateFilter('minPrice', event.target.value)}
                className='mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                placeholder='0đ'
              />
            </label>
            <label className='block'>
              <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Tối đa</span>
              <input
                type='number'
                min='0'
                value={filters.maxPrice}
                onChange={(event) => updateFilter('maxPrice', event.target.value)}
                className='mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                placeholder='Không giới hạn'
              />
            </label>
            <label className='block'>
              <span className='text-xs font-extrabold uppercase tracking-wide text-gray-500'>Diện tích từ</span>
              <input
                type='number'
                min='0'
                value={filters.minArea}
                onChange={(event) => updateFilter('minArea', event.target.value)}
                className='mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                placeholder='m²'
              />
            </label>
          </div>
        </section>

        <section className='mt-6 border-t border-gray-100 pt-6'>
          <h3 className='text-base font-extrabold'>Tiện ích</h3>
          <div className='mt-3 flex flex-wrap gap-2'>
            {amenityOptions.map((item) => (
              <FilterChip
                key={item.id}
                selected={filters.amenityIds.includes(item.id)}
                onClick={() => toggleAmenity(item.id)}
              >
                {item.name}
              </FilterChip>
            ))}
          </div>
          <h3 className='mt-5 text-base font-extrabold'>Lợi ích</h3>
          <div className='mt-3 flex flex-wrap gap-2'>
            {benefits.map((item) => (
              <FilterChip key={item} selected={filters.benefits.includes(item)} onClick={() => toggleBenefit(item)}>
                {item}
              </FilterChip>
            ))}
          </div>
        </section>

        <section className='mt-6 border-t border-gray-100 pt-6'>
          <h3 className='text-base font-extrabold'>Tìm theo từ khóa</h3>
          <div className='relative mt-3'>
            <FaSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
            <input
              value={filters.keyword}
              onChange={(event) => updateFilter('keyword', event.target.value)}
              className='h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
              placeholder='Nhập từ khóa tìm kiếm...'
            />
          </div>
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <FilterSelect
              label='Sắp xếp'
              options={sortOptions}
              value={filters.sort}
              onChange={(event) => updateFilter('sort', event.target.value)}
            />
          </div>
        </section>
      </div>

      <div className='sticky bottom-0 mt-6 flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4'>
        <button
          type='button'
          onClick={() => setFilters(defaultAdvancedFilters)}
          className='text-sm font-extrabold text-[#181A20] underline underline-offset-4'
        >
          Xóa tất cả
        </button>
        <button
          type='button'
          onClick={handleSearch}
          className='flex items-center gap-2 rounded-xl bg-[#181A20] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#181A20]/20'
        >
          <FaSearch />
          Tìm kiếm
        </button>
      </div>
    </div>
  )
}

export const SiteHeader = ({ accountLabel = 'Đăng nhập' }: SiteHeaderProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isShortcutOpen, setIsShortcutOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isFavoriteOpen, setIsFavoriteOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<HeaderUser | null>(() => parseStoredUser())
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('accessToken')))
  const [searchKeyword, setSearchKeyword] = useState('')
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const navigate = useNavigate()

  const isAuthenticated = hasToken || Boolean(user)
  const isAdmin = Boolean(user?.roles?.includes('ADMIN'))
  const isStudent = Boolean(user?.roles?.includes('STUDENT'))
  const displayName = user?.fullName || user?.email || 'Tài khoản'
  const primaryRole = user?.roles?.find((role) => role !== 'USER') || user?.roles?.[0] || 'USER'
  const initials = useMemo(() => getInitials(user?.fullName, user?.email), [user?.email, user?.fullName])
  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  )

  useEffect(() => {
    const syncAuthState = () => {
      setUser(parseStoredUser())
      setHasToken(Boolean(localStorage.getItem('accessToken')))
    }

    window.addEventListener('storage', syncAuthState)
    window.addEventListener('focus', syncAuthState)
    window.addEventListener('auth-user-updated', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('focus', syncAuthState)
      window.removeEventListener('auth-user-updated', syncAuthState)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }

    setIsLoadingNotifications(true)
    try {
      const response = await notificationService.getNotifications({ limit: 10 })
      setNotifications(response.data)
    } catch {
      setNotifications([])
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      return undefined
    }

    void loadNotifications()

    const stream = notificationService.subscribe((notification) => {
      setNotifications((current) => {
        const existingIndex = current.findIndex((item) => item.id === notification.id)
        if (existingIndex >= 0) {
          const next = [...current]
          next[existingIndex] = notification
          return next
        }

        return [notification, ...current].slice(0, 10)
      })
    })

    return () => {
      stream?.close()
    }
  }, [isAuthenticated, loadNotifications])

  const handleNotificationClick = async (notification: AppNotification) => {
    const postPath = getNotificationPostPath(notification)

    if (!notification.isRead) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      )
      await notificationService.markAsRead(notification.id).catch(() => undefined)
    }

    setIsNotificationOpen(false)

    if (postPath) {
      navigate(postPath)
    }
  }

  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
    await notificationService.markAllAsRead().catch(() => undefined)
  }

  const closeHeaderMenus = () => {
    setIsShortcutOpen(false)
    setIsAccountOpen(false)
    setIsFavoriteOpen(false)
    setIsNotificationOpen(false)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    void authService.logout().catch(() => undefined)
    clearAuthSession()
    setUser(null)
    setHasToken(false)
    closeHeaderMenus()
    navigate('/login')
  }

  const searchUrl = searchKeyword.trim()
    ? `/posts/search?keyword=${encodeURIComponent(searchKeyword.trim())}`
    : '/posts/search'

  return (
    <header className='sticky top-0 z-30 bg-gradient-to-r from-[#000814] via-[#001D3D] to-[#003566] shadow-lg shadow-[#001D3D]/20'>
      <div className='mx-auto flex min-h-[80px] lg:h-32 max-w-[1440px] flex-wrap items-center justify-between gap-y-4 px-4 py-3 lg:flex-nowrap lg:gap-y-0 lg:px-8 lg:py-0'>
        <div className='order-1 flex items-center gap-2 lg:gap-8'>
          <Link to='/home' className='flex w-32 lg:w-96 items-center'>
            <img src={logo} alt='UniStay' className='h-20 w-40 lg:h-36 lg:w-72 object-contain' />
          </Link>

        <div className='hidden lg:block relative'>
          <button
            type='button'
            onClick={() => {
              setIsShortcutOpen((current) => !current)
              setIsFilterOpen(false)
              setIsFavoriteOpen(false)
              setIsNotificationOpen(false)
              setIsAccountOpen(false)
              setIsMobileMenuOpen(false)
            }}
            className='grid h-11 w-11 place-items-center rounded-full bg-[#FFC300] text-[#001D3D] shadow-md transition hover:bg-[#FFD60A]'
            aria-label='Mở menu lối tắt'
            aria-expanded={isShortcutOpen}
          >
            <FaBars />
          </button>

          {isShortcutOpen ? (
            <div className='absolute left-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
              <div className='border-b border-gray-100 px-5 py-4'>
                <p className='text-sm font-extrabold'>Lối tắt</p>
                <p className='mt-1 text-xs font-medium text-gray-500'>Truy cập nhanh các thao tác thường dùng.</p>
              </div>
              <div className='grid p-3'>
                <Link
                  to='/home'
                  onClick={() => setIsShortcutOpen(false)}
                  className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                >
                  <FaHome className='text-[#003566]' />
                  Trang chủ
                </Link>
                <Link
                  to='/posts/search'
                  onClick={() => setIsShortcutOpen(false)}
                  className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                >
                  <FaSearch className='text-[#003566]' />
                  Tìm bài đăng
                </Link>
                {!isAdmin ? (
                  <Link
                    to={isAuthenticated ? '/posts/create' : '/login'}
                    onClick={() => setIsShortcutOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaPlusCircle className='text-[#FFC300]' />
                    Đăng tin mới
                  </Link>
                ) : null}
                {isAuthenticated && !isAdmin ? (
                  <Link
                    to='/contacts'
                    onClick={() => setIsShortcutOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaUsers className='text-[#003566]' />
                    Yêu cầu liên hệ
                  </Link>
                ) : null}
                {isStudent ? (
                  <Link
                    to='/demands'
                    onClick={() => setIsShortcutOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaSlidersH className='text-[#003566]' />
                    Nhu cầu ở ghép
                  </Link>
                ) : null}
                {isAdmin ? (
                  <Link
                    to='/admin/overview'
                    onClick={() => setIsShortcutOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaUsers className='text-[#FFC300]' />
                    Trang quản trị
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
          </div>
        </div>

        <div className='order-3 flex relative h-12 w-full lg:w-auto flex-1 max-w-[560px] items-center rounded-full border border-[#FFD60A]/20 bg-white px-5 shadow-sm lg:order-2'>
          <FaHome className='mr-3 text-[#001D3D]' />
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                navigate(searchUrl)
              }
            }}
            className='min-w-0 flex-1 border-none bg-transparent text-sm text-[#181A20] outline-none placeholder:text-gray-400'
            placeholder='Nhập vào từ khóa tìm kiếm'
          />
          <button
            type='button'
            onClick={() => {
              setIsFilterOpen((current) => !current)
              setIsShortcutOpen(false)
              setIsFavoriteOpen(false)
              setIsNotificationOpen(false)
              setIsAccountOpen(false)
            }}
            className='ml-4 flex items-center gap-2 text-sm font-bold text-[#181A20]'
          >
            <FaSlidersH className='text-[#001D3D]' />
            Nâng cao
          </button>
          <Link to={searchUrl} className='ml-4 grid h-9 w-9 place-items-center rounded-full bg-[#FFC300] text-white'>
            <FaSearch />
          </Link>

          {isFilterOpen && <AdvancedFilterPanel onClose={() => setIsFilterOpen(false)} />}
        </div>

        <div className='hidden lg:flex order-4 items-center gap-2 lg:order-3 lg:gap-4'>
          {isAuthenticated && !isAdmin ? (
            <div className='relative'>
              <button
                type='button'
                onClick={() => {
                  setIsFavoriteOpen((current) => !current)
                  setIsShortcutOpen(false)
                  setIsFilterOpen(false)
                  setIsNotificationOpen(false)
                  setIsAccountOpen(false)
                }}
                className='grid h-11 w-11 place-items-center rounded-full bg-[#FFC300] text-white shadow-md'
                aria-label='Mở danh sách yêu thích'
              >
                <FaHeart />
              </button>

              {isFavoriteOpen && (
                <div className='absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
                  <div className='border-b border-gray-100 px-5 py-4'>
                    <p className='text-sm font-extrabold'>Bài đăng yêu thích</p>
                    <p className='mt-1 text-xs font-medium text-gray-500'>
                      {isAuthenticated
                        ? 'Các phòng đã lưu sẽ được đồng bộ với tài khoản của bạn.'
                        : 'Đăng nhập để lưu và quản lý phòng yêu thích.'}
                    </p>
                  </div>
                  <div className='p-3'>
                    <Link
                      to={isAuthenticated ? '/posts/favourites' : '/login'}
                      onClick={() => setIsFavoriteOpen(false)}
                      className='block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                    >
                      {isAuthenticated ? 'Xem danh sách yêu thích' : 'Đăng nhập để xem'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setIsNotificationOpen((current) => !current)
                setIsShortcutOpen(false)
                setIsFilterOpen(false)
                setIsFavoriteOpen(false)
                setIsAccountOpen(false)
                void loadNotifications()
              }}
              className='relative grid h-11 w-11 place-items-center rounded-full text-[#FFC300]'
              aria-label='Mở thông báo'
            >
              <FaBell className='text-3xl' />
              {unreadNotificationCount > 0 ? (
                <span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-extrabold leading-none text-white'>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              ) : null}
            </button>

            {isNotificationOpen && (
              <div className='absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
                <div className='border-b border-gray-100 px-5 py-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <span>
                      <p className='text-sm font-extrabold'>Thông báo</p>
                      <p className='mt-1 text-xs font-medium text-gray-500'>
                        {isAuthenticated
                          ? 'Cập nhật về bài đăng, bình luận và yêu cầu thuê phòng.'
                          : 'Đăng nhập để nhận thông báo theo tài khoản.'}
                      </p>
                    </span>
                    {unreadNotificationCount > 0 ? (
                      <button
                        type='button'
                        onClick={handleMarkAllNotificationsAsRead}
                        className='rounded-full bg-[#FFF7D6] px-3 py-1 text-[11px] font-extrabold text-[#7A5A00] hover:bg-[#FFE680]'
                      >
                        Đã đọc
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className='max-h-96 overflow-y-auto p-3'>
                  {!isAuthenticated ? (
                    <Link
                      to='/login'
                      onClick={() => setIsNotificationOpen(false)}
                      className='block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                    >
                      Đăng nhập để xem thông báo
                    </Link>
                  ) : isLoadingNotifications ? (
                    <div className='rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-500'>
                      Đang tải thông báo...
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className='space-y-2'>
                      {notifications.map((notification) => {
                        const hasPostPath = Boolean(getNotificationPostPath(notification))

                        return (
                          <button
                            key={notification.id}
                            type='button'
                            onClick={() => void handleNotificationClick(notification)}
                            className={`w-full rounded-xl border px-4 py-3 text-left transition hover:border-[#FFC300] hover:bg-[#FFF7D6] ${
                              notification.isRead ? 'border-gray-100 bg-white' : 'border-[#FFC300]/50 bg-[#FFF7D6]'
                            }`}
                          >
                            <span className='flex items-start justify-between gap-3'>
                              <span className='text-sm font-extrabold text-[#181A20]'>{notification.title}</span>
                              {!notification.isRead ? (
                                <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FFC300]' />
                              ) : null}
                            </span>
                            {notification.content ? (
                              <span className='mt-1 block line-clamp-2 text-xs font-medium leading-5 text-gray-600'>
                                {notification.content}
                              </span>
                            ) : null}
                            <span className='mt-2 flex items-center justify-between text-[11px] font-bold text-gray-400'>
                              <span>{formatNotificationTime(notification.createdAt)}</span>
                              {hasPostPath ? <span>Xem bài đăng</span> : null}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className='rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-500'>
                      Chưa có thông báo mới.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className='relative'>
            {isAuthenticated ? (
              <button
                type='button'
                onClick={() => {
                  setIsAccountOpen((current) => !current)
                  setIsShortcutOpen(false)
                  setIsFilterOpen(false)
                  setIsFavoriteOpen(false)
                  setIsNotificationOpen(false)
                }}
                className='flex h-12 items-center gap-3 rounded-full border border-white/20 bg-white/5 pl-1.5 pr-4 text-sm font-bold text-white transition hover:bg-white/10'
                aria-expanded={isAccountOpen}
              >
                <HeaderAvatar
                  avatarUrl={user?.avatarUrl}
                  initials={initials}
                  className='grid h-9 w-9 place-items-center text-xs font-extrabold'
                />
                <span className='max-w-28 truncate'>{displayName}</span>
                <FaChevronDown className={`text-xs transition ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <Link to='/login' className='rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white'>
                {accountLabel}
              </Link>
            )}

            {isAuthenticated && isAccountOpen && (
              <div className='absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
                <div className='bg-gradient-to-br from-[#001D3D] to-[#003566] px-5 py-5 text-white'>
                  <div className='flex items-center gap-3'>
                    <HeaderAvatar
                      avatarUrl={user?.avatarUrl}
                      initials={initials}
                      className='grid h-12 w-12 place-items-center text-sm font-extrabold'
                    />
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-extrabold'>{displayName}</span>
                      <span className='mt-1 block text-xs font-semibold uppercase tracking-wide text-[#FFD60A]'>
                        {primaryRole}
                      </span>
                    </span>
                  </div>
                </div>

                <div className='grid p-3'>
                  <Link
                    to='/posts/search'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaSearch className='text-[#003566]' />
                    Xem bài đăng
                  </Link>
                  <Link
                    to='/account/profile'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaUserCircle className='text-[#003566]' />
                    Thông tin cá nhân
                  </Link>
                  <Link
                    to='/account/password'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaKey className='text-[#003566]' />
                    Đổi mật khẩu
                  </Link>
                  <Link
                    to='/account/blocked-users'
                    onClick={() => setIsAccountOpen(false)}
                    className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                  >
                    <FaBan className='text-red-500' />
                    Danh sách đã chặn
                  </Link>
                  <Link
                    to='/posts/create'
                    onClick={() => setIsAccountOpen(false)}
                    className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]`}
                  >
                    <FaPlusCircle className='text-[#FFC300]' />
                    Đăng tin mới
                  </Link>
                  <Link
                    to='/posts/me'
                    onClick={() => setIsAccountOpen(false)}
                    className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]`}
                  >
                    <FaListAlt className='text-[#003566]' />
                    Bài đăng của tôi
                  </Link>
                  <Link
                    to='/contacts'
                    onClick={() => setIsAccountOpen(false)}
                    className={`${isAdmin ? 'hidden' : 'flex'} items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]`}
                  >
                    <FaUsers className='text-[#003566]' />
                    Danh sách đã liên hệ
                  </Link>
                  <Link
                    to='/demands'
                    onClick={() => setIsAccountOpen(false)}
                    className={`${isStudent ? 'flex' : 'hidden'} items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]`}
                  >
                    <FaSlidersH className='text-[#003566]' />
                    Nhu cầu và gợi ý
                  </Link>
                  {user?.roles?.includes('ADMIN') ? (
                    <Link
                      to='/admin/overview'
                      onClick={() => setIsAccountOpen(false)}
                      className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'
                    >
                      <FaUsers className='text-[#FFC300]' />
                      Trang quản trị
                    </Link>
                  ) : null}
                  <Link
                    to='/posts/favourites'
                    onClick={() => setIsAccountOpen(false)}
                    className={`${!isAdmin ? 'flex' : 'hidden'} items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]`}
                  >
                    <FaHeart className='text-[#FFC300]' />
                    Yêu thích
                  </Link>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='mt-2 flex items-center gap-3 rounded-xl border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50'
                  >
                    <FaSignOutAlt />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navbar Toggle */}
        <div className='order-2 flex relative lg:hidden'>
          <button
            type='button'
            onClick={() => {
              setIsMobileMenuOpen((current) => !current)
              setIsShortcutOpen(false)
            }}
            className='grid h-11 w-11 place-items-center rounded-full bg-[#FFC300] text-[#001D3D] shadow-md transition hover:bg-[#FFD60A]'
            aria-label='Mở menu di động'
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {isMobileMenuOpen && (
            <div className='absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-white text-[#181A20] shadow-2xl shadow-[#000814]/25'>
              <div className='bg-gradient-to-br from-[#001D3D] to-[#003566] px-5 py-4 text-white'>
                {isAuthenticated ? (
                  <div className='flex items-center gap-3'>
                    <HeaderAvatar avatarUrl={user?.avatarUrl} initials={initials} className='grid h-10 w-10 place-items-center text-xs font-extrabold' />
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-extrabold'>{displayName}</span>
                      <span className='mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-[#FFD60A]'>{primaryRole}</span>
                    </span>
                  </div>
                ) : (
                  <p className='text-sm font-extrabold'>Menu</p>
                )}
              </div>
              <div className='grid p-3 max-h-[70vh] overflow-y-auto'>
                <Link to='/home' onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                  <FaHome className='text-[#003566]' /> Trang chủ
                </Link>
                <Link to='/posts/search' onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                  <FaSearch className='text-[#003566]' /> Tìm bài đăng
                </Link>
                {isAuthenticated && !isAdmin && (
                  <Link to='/posts/favourites' onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                    <FaHeart className='text-red-500' /> Yêu thích
                  </Link>
                )}
                {isAuthenticated && (
                  <div className='relative'>
                    <button onClick={() => { closeHeaderMenus(); void loadNotifications(); setIsNotificationOpen(true); }} className='flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                      <span className='flex items-center gap-3'><FaBell className='text-[#003566]' /> Thông báo</span>
                      {unreadNotificationCount > 0 && <span className='rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white'>{unreadNotificationCount}</span>}
                    </button>
                  </div>
                )}
                <div className='my-2 border-t border-gray-100' />
                {!isAdmin && (
                  <Link to={isAuthenticated ? '/posts/create' : '/login'} onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                    <FaPlusCircle className='text-[#FFC300]' /> Đăng tin mới
                  </Link>
                )}
                {isAuthenticated && !isAdmin && (
                  <Link to='/contacts' onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                    <FaUsers className='text-[#003566]' /> Yêu cầu liên hệ
                  </Link>
                )}
                {isStudent && (
                  <Link to='/demands' onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                    <FaSlidersH className='text-[#003566]' /> Nhu cầu ở ghép
                  </Link>
                )}
                {isAdmin && (
                  <Link to='/admin/overview' onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                    <FaUsers className='text-[#FFC300]' /> Trang quản trị
                  </Link>
                )}
                {isAuthenticated && (
                  <>
                    <div className='my-2 border-t border-gray-100' />
                    <Link to='/account/profile' onClick={closeHeaderMenus} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#FFF7D6]'>
                      <FaUserCircle className='text-[#003566]' /> Thông tin cá nhân
                    </Link>
                    <button onClick={handleLogout} className='flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-[#FFF7D6]'>
                      <FaSignOutAlt /> Đăng xuất
                    </button>
                  </>
                )}
                {!isAuthenticated && (
                  <Link to='/login' onClick={closeHeaderMenus} className='mt-2 flex items-center justify-center rounded-xl bg-[#001D3D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#003566]'>
                    {accountLabel}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export const SiteFooter = () => (
  <footer className='bg-gradient-to-b from-[#0D63C2] to-[#000814] px-8 py-12 text-white'>
    <div className='mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]'>
      <div>
        <div className='flex items-center gap-4'>
          <img src={logo} alt='UniStay' className='h-24 w-32 object-contain' />
          <span className='text-3xl font-extrabold text-[#FFD60A]'>UNISTAY</span>
        </div>
        <p className='mt-4 max-w-md text-sm leading-6 text-blue-100'>
          Website kết nối sinh viên và chủ trọ tại Đà Nẵng. Tìm kiếm phòng trọ, so sánh thông tin và kết nối bạn cùng
          phòng một cách minh bạch.
        </p>
      </div>
      <div>
        <h4 className='mb-4 text-lg font-bold text-[#FFD60A]'>Liên hệ</h4>
        <p className='text-sm leading-7 text-blue-100'>unistay.danang@gmail.com</p>
        <p className='text-sm leading-7 text-blue-100'>0123 456 789</p>
        <p className='text-sm leading-7 text-blue-100'>Đà Nẵng, Việt Nam</p>
      </div>
      <div>
        <h4 className='mb-4 text-lg font-bold text-[#FFD60A]'>Điều hướng</h4>
        <div className='grid gap-2 text-sm text-blue-100'>
          <Link to='/home' className='transition hover:text-[#FFD60A]'>
            Trang chủ
          </Link>
          <Link to='/posts/search' className='transition hover:text-[#FFD60A]'>
            Bài đăng
          </Link>
          <Link to='/posts/search?purpose=FIND_ROOMMATE' className='transition hover:text-[#FFD60A]'>
            Tìm bạn ở ghép
          </Link>
          <Link to='/contacts' className='transition hover:text-[#FFD60A]'>
            Hỗ trợ liên hệ
          </Link>
        </div>
      </div>
    </div>
    <div className='mx-auto mt-10 max-w-6xl border-t border-white/10 pt-5 text-xs text-blue-100'>
      © {new Date().getFullYear()} UNISTAY Đà Nẵng. All rights reserved.
    </div>
  </footer>
)
