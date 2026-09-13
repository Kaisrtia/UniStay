import { useEffect, useState } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { FaBolt, FaMapMarkerAlt, FaParking, FaRegHeart, FaRoute, FaShieldAlt, FaStar, FaWifi } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import locationService from '@/services/locationService'
import postService, { type Post } from '@/services/postService'

type Listing = {
  id: string
  image?: string
  title: string
  location: string
  price: string
  meta: string[]
  purpose: string
  accent: string
}

type Area = {
  name: string
  count: string
  color: string
  wardId?: number
}

const fallbackListings: Listing[] = [
  {
    id: 'pst_seed_001',
    title: 'Căn hộ mini gần Đại học Bách khoa, đầy đủ nội thất',
    location: 'Liên Chiểu, Đà Nẵng',
    price: '3.000.000đ/tháng',
    meta: ['28m²', 'Máy giặt', 'Ban công'],
    purpose: 'Cho thuê',
    accent: 'from-[#0D63C2] to-[#003566]'
  },
  {
    id: 'pst_seed_003',
    title: 'Phòng trọ yên tĩnh cho sinh viên',
    location: 'Hải Châu, Đà Nẵng',
    price: '2.200.000đ/tháng',
    meta: ['22m²', 'WiFi', 'An ninh'],
    purpose: 'Mới đăng',
    accent: 'from-[#003566] to-[#001D3D]'
  },
  {
    id: 'pst_seed_004',
    title: 'Tìm nữ ở ghép gần Trường Đại học Kinh tế',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    price: '1.500.000đ/tháng',
    meta: ['Ở ghép', 'Tự do', 'Gần trường'],
    purpose: 'Ở ghép',
    accent: 'from-[#FFD60A] to-[#FFC300]'
  }
]

const areas: Area[] = [
  { name: 'Hải Châu', count: 'Nhiều bài đăng phù hợp', color: '#0D63C2' },
  { name: 'Liên Chiểu', count: 'Gần các trường đại học', color: '#FFC300' },
  { name: 'Cẩm Lệ', count: 'Giá thuê dễ tiếp cận', color: '#003566' },
  { name: 'Sơn Trà', count: 'Gần trung tâm và biển', color: '#22C55E' }
]

const amenities = [
  { icon: FaWifi, label: 'WiFi mạnh' },
  { icon: FaParking, label: 'Chỗ để xe' },
  { icon: FaShieldAlt, label: 'An ninh tốt' },
  { icon: FaBolt, label: 'Giờ giấc tự do' }
]

const getStoredRoles = () => {
  const rawUser = localStorage.getItem('authUser')

  if (!rawUser) {
    return []
  }

  try {
    const user = JSON.parse(rawUser) as { roles?: string[]; role?: string }
    return user.roles || (user.role ? [user.role] : [])
  } catch {
    return []
  }
}

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

const getPriceLabel = (price: string | number) => {
  const value = Number(price)
  return Number.isFinite(value) ? `${currencyFormatter.format(value)}/tháng` : `${price}`
}

const mapPostToListing = (post: Post, index: number): Listing => ({
  id: post.id,
  image: post.postImages?.[0]?.imageUrl,
  title: post.title,
  location: post.ward?.name || post.detailAddress,
  price: getPriceLabel(post.price),
  meta: [
    `${post.area}m²`,
    roomTypeLabel[String(post.roomType)] || String(post.roomType || 'Phòng'),
    post.postPurpose === 'FIND_ROOMMATE' ? 'Ở ghép' : 'Cho thuê'
  ],
  purpose: post.purpose === 'FIND_ROOMMATE' ? 'Ở ghép' : 'Cho thuê',
  accent: ['from-[#0D63C2] to-[#003566]', 'from-[#003566] to-[#001D3D]', 'from-[#FFD60A] to-[#FFC300]'][index % 3]
})

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const ListingCard = ({ listing, index = 0 }: { listing: Listing; index?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <Link
      to={`/posts/${listing.id}`}
      className='block overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-lg shadow-[#001D3D]/5 transition duration-300 hover:-translate-y-1.5 hover:border-[#0D63C2]/30 hover:shadow-xl hover:shadow-[#0D63C2]/15'
    >
      <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${listing.accent}`}>
        {listing.image ? (
          <img
            src={listing.image}
            alt={listing.title}
            className='h-full w-full object-cover transition duration-300 hover:scale-105'
          />
        ) : (
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.32),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.18),transparent_34%)]' />
        )}
        <span className='absolute left-4 top-4 rounded-full bg-[#FFC300] px-4 py-1.5 text-xs font-extrabold text-[#001D3D] shadow-md'>
          {listing.purpose}
        </span>
        <motion.span 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className='absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#003566] shadow-sm'
        >
          <FaRegHeart />
        </motion.span>
      </div>
      <div className='p-5'>
        <h3 className='min-h-[56px] text-xl font-extrabold leading-7 text-[#181A20] line-clamp-2'>{listing.title}</h3>
        <p className='mt-3 flex items-center gap-2 text-sm font-medium text-gray-500'>
          <FaMapMarkerAlt className='text-[#FFC300]' />
          {listing.location}
        </p>
        <div className='mt-5 flex items-center justify-between'>
          <p className='text-xl font-extrabold text-[#003566]'>{listing.price}</p>
          <div className='flex items-center gap-1 text-sm font-bold text-[#FFC300]'>
            <FaStar />
            4.8
          </div>
        </div>
        <div className='mt-4 flex flex-wrap gap-2'>
          {listing.meta.map((item) => (
            <span key={item} className='rounded-full bg-[#F5F7FA] border border-gray-100 px-3 py-1 text-xs font-semibold text-gray-600'>
              {item}
            </span>
          ))}
        </div>
      </div>
    </Link>
  </motion.div>
)

const HomePage = () => {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>(fallbackListings)
  const [searchAreas, setSearchAreas] = useState<Area[]>(areas)
  const [roles, setRoles] = useState<string[]>(() => getStoredRoles())
  const [overviewStats, setOverviewStats] = useState({
    approvedPosts: 0,
    wards: 0,
    mappedPosts: 0
  })

  useEffect(() => {
    const syncRoles = () => setRoles(getStoredRoles())
    window.addEventListener('auth-user-updated', syncRoles)
    window.addEventListener('storage', syncRoles)

    const loadFeaturedPosts = async () => {
      try {
        const [postResult, wardResult] = await Promise.all([
          postService.getPosts({
            limit: 12,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }),
          locationService.getWards()
        ])

        if (postResult.data.length > 0) {
          const mapped = postResult.data.slice(0, 6).map(mapPostToListing)
          setFeaturedListings([...mapped, ...fallbackListings.slice(mapped.length, 6)])
        }

        if (wardResult.length > 0) {
          setSearchAreas(
            wardResult.slice(0, 4).map((ward, index) => ({
              name: ward.name,
              count: 'Xem danh sách bài đăng trong khu vực này',
              color: areas[index % areas.length].color,
              wardId: ward.id
            }))
          )
        }

        setOverviewStats({
          approvedPosts: postResult.meta?.total || postResult.data.length,
          wards: wardResult.length,
          mappedPosts: postResult.data.filter((post) => Number(post.latitude) && Number(post.longitude)).length
        })
      } catch {
        setFeaturedListings(fallbackListings)
      }
    }

    void loadFeaturedPosts()
    return () => {
      window.removeEventListener('auth-user-updated', syncRoles)
      window.removeEventListener('storage', syncRoles)
    }
  }, [])

  const isAdmin = roles.includes('ADMIN')

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />

      <main>
        <section className='relative overflow-hidden bg-gradient-to-br from-[#000814] via-[#001D3D] to-[#0D63C2] px-8 py-16 text-white'>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className='absolute right-24 top-12 h-72 w-72 rounded-full bg-[#FFC300]/20 blur-3xl' 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className='absolute bottom-8 left-8 h-64 w-64 rounded-full bg-[#0D63C2]/30 blur-3xl' 
          />
          <div className='relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr]'>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.p variants={fadeInUp} className='text-sm font-extrabold tracking-[0.28em] text-[#FFD60A]'>UNISTAY ĐÀ NẴNG</motion.p>
              <motion.h1 variants={fadeInUp} className='mt-6 max-w-3xl text-5xl font-extrabold leading-tight'>
                Tìm phòng trọ phù hợp cho sinh viên trong vài phút
              </motion.h1>
              <motion.p variants={fadeInUp} className='mt-6 max-w-2xl text-lg font-medium leading-8 text-blue-100'>
                Khám phá phòng trọ, căn hộ và bạn cùng phòng quanh các trường đại học tại Đà Nẵng với bộ lọc theo khu
                vực, ngân sách và tiện ích.
              </motion.p>
              <motion.div variants={fadeInUp} className='mt-8 flex flex-wrap gap-4'>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to='/posts/search'
                    className='block rounded-full bg-[#FFC300] px-7 py-3 font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20 transition-colors hover:bg-[#ffcf33]'
                  >
                    Tìm phòng ngay
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to='/posts/nearby'
                    className='inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#0D63C2] px-7 py-3 font-extrabold text-white shadow-lg shadow-[#0D63C2]/20 transition hover:bg-[#003566]'
                  >
                    <FaRoute />
                    Tìm phòng gần nhất
                  </Link>
                </motion.div>
                {isAdmin ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to='/admin/overview' className='block rounded-full bg-white px-7 py-3 font-extrabold text-[#003566] shadow-lg transition-colors hover:bg-gray-100'>
                      Trang quản trị
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to='/posts/create' className='block rounded-full bg-white px-7 py-3 font-extrabold text-[#003566] shadow-lg transition-colors hover:bg-gray-100'>
                      Đăng tin mới
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            <motion.aside 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className='rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur shadow-2xl'
            >
              <h2 className='text-2xl font-extrabold'>Dữ liệu đang có</h2>
              <div className='mt-8 grid grid-cols-3 gap-5'>
                {[
                  [overviewStats.approvedPosts, 'bài đã duyệt'],
                  [overviewStats.wards, 'phường/xã'],
                  [overviewStats.mappedPosts, 'bài có tọa độ']
                ].map(([value, label], idx) => (
                  <motion.div 
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                  >
                    <p className='text-3xl font-extrabold text-[#FFD60A]'>{value}</p>
                    <p className='mt-2 text-sm font-medium text-blue-100'>{label}</p>
                  </motion.div>
                ))}
              </div>
              <div className='mt-8 border-t border-white/20 pt-6 text-sm leading-6 text-blue-100'>
                Số liệu được cập nhật từ hệ thống bài đăng, khu vực và tọa độ bản đồ.
              </div>
            </motion.aside>
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-8 py-20'>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className='flex items-end justify-between gap-6'>
              <motion.div variants={fadeInUp}>
                <h2 className='text-4xl font-extrabold text-[#181A20]'>Bài đăng nổi bật</h2>
                <p className='mt-3 text-gray-500'>
                  Các phòng đã được duyệt, có hình ảnh rõ ràng và thông tin giá minh bạch.
                </p>
              </motion.div>
              <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to='/posts/search' className='rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#003566]'>
                  Xem tất cả
                </Link>
              </motion.div>
            </div>

            <div className='mt-10 grid gap-7 lg:grid-cols-3'>
              <AnimatePresence>
                {featuredListings.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} index={index} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        <section className='mx-auto max-w-7xl px-8 pb-20'>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <h2 className='text-4xl font-extrabold'>Khu vực được tìm kiếm nhiều</h2>
              <p className='mt-3 text-gray-500'>Bắt đầu từ những khu vực có nhiều lựa chọn phù hợp với sinh viên.</p>
            </motion.div>
            <div className='mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
              <AnimatePresence>
                {searchAreas.map((area, index) => (
                  <motion.div 
                    key={area.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={
                        area.wardId
                          ? `/posts/search?wardId=${area.wardId}`
                          : `/posts/search?keyword=${encodeURIComponent(area.name)}`
                      }
                      className='block rounded-2xl border border-[#E6EAF0] bg-white p-6 shadow-lg shadow-[#001D3D]/5 transition duration-300 hover:-translate-y-1.5 hover:border-[#FFC300] hover:shadow-xl hover:shadow-[#001D3D]/10'
                    >
                      <div className='h-1.5 w-16 rounded-full' style={{ backgroundColor: area.color }} />
                      <h3 className='mt-8 text-2xl font-extrabold'>{area.name}</h3>
                      <p className='mt-2 text-sm font-medium text-gray-500'>{area.count}</p>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        <section className='mx-auto max-w-7xl px-8 pb-24'>
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className='grid overflow-hidden rounded-3xl bg-[#001D3D] text-white shadow-2xl shadow-[#001D3D]/20 lg:grid-cols-[1.1fr_0.9fr]'
          >
            <div className='p-10'>
              <h2 className='max-w-2xl text-4xl font-extrabold leading-tight'>
                Tạo nhu cầu thuê trọ để nhận gợi ý phù hợp hơn
              </h2>
              <p className='mt-5 max-w-2xl text-blue-100'>
                Lưu ngân sách, khu vực, trường học và tiêu chí bạn cùng phòng. UniStay sẽ ưu tiên những bài đăng phù hợp
                nhất.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='mt-8 inline-block'>
                <Link
                  to='/posts/search'
                  className='block rounded-full bg-[#FFC300] px-7 py-3 font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20 transition-colors hover:bg-[#ffcf33]'
                >
                  Xem gợi ý
                </Link>
              </motion.div>
            </div>
            <div className='grid gap-4 bg-[#003566] p-10 sm:grid-cols-2'>
              {amenities.map(({ icon: Icon, label }) => (
                <motion.div 
                  key={label} 
                  whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  className='rounded-2xl bg-white/10 p-5 transition-colors duration-300'
                >
                  <Icon className='text-2xl text-[#FFD60A]' />
                  <p className='mt-4 font-bold'>{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default HomePage
