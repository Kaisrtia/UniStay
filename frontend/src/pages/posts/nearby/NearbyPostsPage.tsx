import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

import L from 'leaflet'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  FaArrowLeft,
  FaBolt,
  FaCrosshairs,
  FaHome,
  FaMapMarkerAlt,
  FaUserFriends,
  FaRoute,
  FaUniversity
} from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import locationService, { type University } from '@/services/locationService'
import postService, { type NearbyPost, type RoutePath } from '@/services/postService'

type SelectedPoint = {
  lat: number
  lng: number
  label: string
  source: 'custom' | 'university'
}

type SelectedRoute = RoutePath & {
  postId: string
}

const defaultMapCenter: [number, number] = [16.0544, 108.2022]
const fallbackImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=640&q=80'
const radiusOptions = [1, 2, 3, 5, 10]
const mapTileAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

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

const purposeLabel: Record<string, string> = {
  RENT: 'Cho thuê',
  FIND_ROOMMATE: 'Ở ghép'
}

const formatCurrency = (value: string | number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? `${currencyFormatter.format(numberValue)}/tháng` : `${value}`
}

const formatDistance = (distanceKm?: number) => {
  if (!Number.isFinite(distanceKm)) {
    return 'Chưa rõ'
  }

  return distanceKm! < 1 ? `${Math.round(distanceKm! * 1000)} m` : `${distanceKm!.toFixed(1)} km`
}

const formatDuration = (durationMinutes?: number) => {
  if (!Number.isFinite(durationMinutes)) {
    return 'Chưa rõ'
  }

  return durationMinutes! <= 1 ? 'Khoảng 1 phút' : `Khoảng ${Math.round(durationMinutes!)} phút`
}

const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180

const getUniversityPoint = (university: University): SelectedPoint | null => {
  const lat = Number(university.latitude)
  const lng = Number(university.longitude)

  if (!isValidCoordinate(lat, lng)) {
    return null
  }

  return {
    lat,
    lng,
    label: university.name,
    source: 'university'
  }
}

const getPostImage = (post: NearbyPost) => post.postImages?.[0]?.imageUrl || fallbackImage

const getPostAddress = (post: NearbyPost) => {
  const wardName = post.ward?.name
  return wardName ? `${post.detailAddress}, ${wardName}` : post.detailAddress
}

const houseSvg =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.2 12 3l9 8.2-1.6 1.8L18 11.7V21h-5v-6h-2v6H6v-9.3L4.6 13 3 11.2Z"/></svg>'
const puzzleSvg =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm10 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM2 21v-2.2C2 15.6 4.6 13 7.8 13h1.4c1 0 2 .3 2.8.8A5.8 5.8 0 0 0 8.5 21H2Zm8 0v-1.6c0-3 2.4-5.4 5.4-5.4h3.2c3 0 5.4 2.4 5.4 5.4V21H10Z"/></svg>'

const createPostIcon = (post: NearbyPost) => {
  const isRoommate = post.postPurpose === 'FIND_ROOMMATE' || post.purpose === 'FIND_ROOMMATE'

  return L.divIcon({
    className: 'nearby-post-marker-icon',
    html: `<span class="nearby-post-marker ${isRoommate ? 'nearby-post-marker--roommate' : 'nearby-post-marker--rent'}">${
      isRoommate ? puzzleSvg : houseSvg
    }</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -38]
  })
}

const createOriginIcon = () =>
  L.divIcon({
    className: 'nearby-origin-marker-icon',
    html: '<span class="nearby-origin-marker"></span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  })

const FlyToSelectedPoint = ({ selectedPoint }: { selectedPoint: SelectedPoint | null }) => {
  const map = useMap()

  useEffect(() => {
    if (selectedPoint) {
      map.flyTo([selectedPoint.lat, selectedPoint.lng], 15, { duration: 0.7 })
    }
  }, [map, selectedPoint])

  return null
}

const MapClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    }
  })

  return null
}

const NearbyPostPreview = ({ post, index = 0 }: { post: NearbyPost, index?: number }) => (
  <motion.article 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
    className='overflow-hidden rounded-lg border border-[#E6EAF0] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg'
  >
    <img src={getPostImage(post)} alt={post.title} className='h-40 w-full object-cover' />
    <div className='p-4'>
      <div className='flex items-center justify-between gap-3'>
        <span className='rounded-full bg-[#FFC300] px-3 py-1 text-xs font-extrabold text-[#001D3D]'>
          {purposeLabel[String(post.postPurpose || post.purpose)] || 'Cho thuê'}
        </span>
        <span className='flex items-center gap-1 text-sm font-extrabold text-[#0D63C2]'>
          <FaRoute />
          {formatDistance(post.distanceKm)}
        </span>
      </div>
      <h3 className='mt-3 line-clamp-2 min-h-[48px] text-base font-extrabold leading-6 text-[#181A20]'>{post.title}</h3>
      <p className='mt-2 text-lg font-extrabold text-[#003566]'>{formatCurrency(post.price)}</p>
      <p className='mt-2 line-clamp-2 flex gap-2 text-sm font-medium text-gray-500'>
        <FaMapMarkerAlt className='mt-0.5 shrink-0 text-[#FFC300]' />
        {getPostAddress(post)}
      </p>
      <div className='mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-600'>
        <span className='rounded-full bg-[#F5F7FA] px-3 py-1'>{roomTypeLabel[String(post.roomType)] || post.roomType}</span>
        <span className='rounded-full bg-[#F5F7FA] px-3 py-1'>{post.area}m²</span>
      </div>
      <Link
        to={`/posts/${post.id}`}
        className='mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#001D3D] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#003566]'
      >
        Xem chi tiết
      </Link>
    </div>
  </motion.article>
)

const NearbyPostsPage = () => {
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversityId, setSelectedUniversityId] = useState('')
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null)
  const [radiusKm, setRadiusKm] = useState(3)
  const [posts, setPosts] = useState<NearbyPost[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute | null>(null)
  const [routeLoadingPostId, setRouteLoadingPostId] = useState<string | null>(null)
  const [routeErrorPostId, setRouteErrorPostId] = useState<string | null>(null)
  const [loadingUniversities, setLoadingUniversities] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const originIcon = useMemo(createOriginIcon, [])
  const selectedPosition = useMemo<[number, number] | null>(
    () => (selectedPoint ? [selectedPoint.lat, selectedPoint.lng] : null),
    [selectedPoint]
  )

  const mappedUniversities = useMemo(
    () => universities.filter((university) => getUniversityPoint(university)),
    [universities]
  )

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setLoadingUniversities(true)
        const data = await locationService.getUniversities()
        setUniversities(data)
      } catch {
        setErrorMessage('Không tải được danh sách trường đại học.')
      } finally {
        setLoadingUniversities(false)
      }
    }

    void loadUniversities()
  }, [])

  useEffect(() => {
    const loadNearbyPosts = async () => {
      if (!selectedPoint) {
        setPosts([])
        setSelectedRoute(null)
        setRouteLoadingPostId(null)
        setRouteErrorPostId(null)
        return
      }

      try {
        setLoading(true)
        setErrorMessage('')
        setSelectedRoute(null)
        setRouteLoadingPostId(null)
        setRouteErrorPostId(null)
        const result = await postService.getNearbyPosts({
          lat: selectedPoint.lat,
          lng: selectedPoint.lng,
          radiusKm,
          limit: 80
        })
        setPosts(result.data)
      } catch {
        setErrorMessage('Không tải được danh sách phòng gần vị trí đã chọn.')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    void loadNearbyPosts()
  }, [radiusKm, selectedPoint])

  const handlePickPoint = (lat: number, lng: number) => {
    setSelectedUniversityId('')
    setSelectedRoute(null)
    setRouteLoadingPostId(null)
    setRouteErrorPostId(null)
    setSelectedPoint({
      lat,
      lng,
      label: 'Vị trí bạn chọn',
      source: 'custom'
    })
  }

  const handleSelectUniversity = (universityId: string) => {
    setSelectedUniversityId(universityId)
    const university = universities.find((item) => item.id === universityId)
    const point = university ? getUniversityPoint(university) : null

    if (point) {
      setSelectedRoute(null)
      setRouteLoadingPostId(null)
      setRouteErrorPostId(null)
      setSelectedPoint(point)
    }
  }

  const handlePostMarkerClick = async (post: NearbyPost) => {
    if (!selectedPoint) {
      return
    }

    const lat = Number(post.latitude)
    const lng = Number(post.longitude)

    if (!isValidCoordinate(lat, lng)) {
      return
    }

    try {
      setRouteLoadingPostId(post.id)
      setRouteErrorPostId(null)
      const route = await postService.getRoutePath({
        fromLat: selectedPoint.lat,
        fromLng: selectedPoint.lng,
        toLat: lat,
        toLng: lng
      })

      if (route) {
        setSelectedRoute({
          ...route,
          postId: post.id
        })
      }
    } catch {
      setSelectedRoute(null)
      setRouteErrorPostId(post.id)
    } finally {
      setRouteLoadingPostId(null)
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />

      <main>
        <section className='border-b border-[#E6EAF0] bg-white px-8 py-8'>
          <div className='mx-auto flex max-w-7xl flex-col gap-6'>
            <Link
              to='/home'
              aria-label='Quay lại trang chủ'
              title='Quay lại trang chủ'
              className='inline-grid h-10 w-10 place-items-center rounded-full border border-[#003566] bg-white text-sm font-extrabold text-[#003566] shadow-sm transition hover:bg-[#003566] hover:text-white'
            >
              <FaArrowLeft />
            </Link>

            <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <p className='text-sm font-extrabold tracking-[0.24em] text-[#0D63C2]'>BẢN ĐỒ PHÒNG TRỌ</p>
                <h1 className='mt-3 text-4xl font-extrabold text-[#001D3D]'>Tìm phòng gần nhất</h1>
                <p className='mt-3 max-w-3xl text-base font-medium leading-7 text-gray-600'>
                  Chọn một điểm trên bản đồ hoặc chọn trường đại học để xem các phòng trọ và bài ở ghép trong bán kính phù hợp.
                </p>
              </motion.div>

              <div className='grid gap-3 sm:grid-cols-[minmax(220px,360px)_auto]'>
                <label className='block'>
                  <span className='mb-2 flex items-center gap-2 text-sm font-extrabold text-[#001D3D]'>
                    <FaUniversity />
                    Chọn theo trường
                  </span>
                  <select
                    value={selectedUniversityId}
                    disabled={loadingUniversities}
                    onChange={(event) => handleSelectUniversity(event.target.value)}
                    className='h-12 w-full rounded-full border border-[#001D3D] bg-white px-5 text-sm font-semibold outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                  >
                    <option value=''>{loadingUniversities ? 'Đang tải trường...' : 'Chọn trường đại học'}</option>
                    {mappedUniversities.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className='block'>
                  <span className='mb-2 flex items-center gap-2 text-sm font-extrabold text-[#001D3D]'>
                    <FaCrosshairs />
                    Bán kính
                  </span>
                  <select
                    value={radiusKm}
                    onChange={(event) => setRadiusKm(Number(event.target.value))}
                    className='h-12 w-full rounded-full border border-[#001D3D] bg-white px-5 text-sm font-semibold outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                  >
                    {radiusOptions.map((radius) => (
                      <option key={radius} value={radius}>
                        {radius} km
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className='px-8 py-8'>
          <div className='mx-auto max-w-7xl'>
            <div className='nearby-map relative z-0 isolate overflow-hidden rounded-lg border border-[#D8DEE8] bg-white shadow-sm'>
              <MapContainer center={defaultMapCenter} zoom={13} scrollWheelZoom style={{ height: 620, width: '100%' }}>
                <TileLayer attribution={mapTileAttribution} url='https://tile.openstreetmap.org/{z}/{x}/{y}.png' />
                <FlyToSelectedPoint selectedPoint={selectedPoint} />
                <MapClickHandler onPick={handlePickPoint} />
                {selectedPosition && (
                  <>
                    <Circle
                      center={selectedPosition}
                      radius={radiusKm * 1000}
                      pathOptions={{ color: '#0D63C2', fillColor: '#0D63C2', fillOpacity: 0.08, weight: 2 }}
                    />
                    <Marker position={selectedPosition} icon={originIcon}>
                      <Popup>
                        <div className='space-y-1'>
                          <p className='font-bold'>{selectedPoint?.label}</p>
                          <p className='text-sm text-gray-600'>Bán kính tìm kiếm: {radiusKm} km</p>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
                {selectedRoute && selectedRoute.geometry.length > 1 && (
                  <Polyline
                    positions={selectedRoute.geometry}
                    pathOptions={{ color: '#0D63C2', opacity: 0.92, weight: 6 }}
                  />
                )}
                {posts.map((post) => {
                  const lat = Number(post.latitude)
                  const lng = Number(post.longitude)

                  if (!isValidCoordinate(lat, lng)) {
                    return null
                  }

                  return (
                    <Marker
                      key={post.id}
                      position={[lat, lng]}
                      icon={createPostIcon(post)}
                      eventHandlers={{ click: () => void handlePostMarkerClick(post) }}
                    >
                      <Popup minWidth={260}>
                        <div className='w-64 space-y-3'>
                          <img src={getPostImage(post)} alt={post.title} className='h-28 w-full rounded-md object-cover' />
                          <div>
                            <p className='text-xs font-extrabold text-[#0D63C2]'>{formatDistance(post.distanceKm)} từ điểm chọn</p>
                            {routeLoadingPostId === post.id && (
                              <p className='mt-1 text-xs font-bold text-gray-500'>Đang tính đường đi...</p>
                            )}
                            {selectedRoute?.postId === post.id && (
                              <p className='mt-1 text-xs font-bold text-[#0D63C2]'>
                                {formatDistance(selectedRoute.distanceKm)} theo đường đi · {formatDuration(selectedRoute.durationMinutes)}
                              </p>
                            )}
                            {routeErrorPostId === post.id && (
                              <p className='mt-1 text-xs font-bold text-red-500'>Không tính được tuyến đường.</p>
                            )}
                            <h3 className='mt-1 line-clamp-2 text-sm font-extrabold text-[#181A20]'>{post.title}</h3>
                            <p className='mt-1 text-sm font-bold text-[#003566]'>{formatCurrency(post.price)}</p>
                          </div>
                          <Link
                            to={`/posts/${post.id}`}
                            className='inline-flex w-full justify-center rounded-full bg-[#001D3D] px-3 py-2 text-xs font-extrabold !text-white hover:!text-white'
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>

              {!selectedPoint && (
                <div className='pointer-events-none absolute left-1/2 top-6 z-[500] w-[min(92%,460px)] -translate-x-1/2 rounded-full bg-white/95 px-5 py-3 text-center text-sm font-extrabold text-[#001D3D] shadow-lg'>
                  Bấm vào bản đồ hoặc chọn một trường đại học để bắt đầu.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className='px-8 pb-14'>
          <div className='mx-auto max-w-7xl'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-2xl font-extrabold text-[#001D3D]'>Kết quả gần điểm chọn</h2>
                <p className='mt-1 text-sm font-semibold text-gray-500'>
                  {selectedPoint
                    ? `${posts.length} bài đăng trong bán kính ${radiusKm} km quanh ${selectedPoint.label}.`
                    : 'Chọn vị trí để xem danh sách bài đăng phù hợp.'}
                </p>
              </div>
              <div className='flex flex-wrap gap-3 text-xs font-extrabold text-[#001D3D]'>
                <span className='inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm'>
                  <FaHome className='text-[#0D63C2]' />
                  Phòng cho thuê
                </span>
                <span className='inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm'>
                  <FaUserFriends className='text-[#FFC300]' />
                  Bài ở ghép
                </span>
                <span className='inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm'>
                  <FaBolt className='text-[#F2765B]' />
                  Gần nhất được xếp trước
                </span>
              </div>
            </div>

            {errorMessage && <p className='mt-6 rounded-lg bg-red-50 px-5 py-4 text-sm font-semibold text-red-600'>{errorMessage}</p>}

            {loading ? (
              <p className='py-12 text-center text-sm font-semibold text-gray-500'>Đang tìm phòng gần vị trí đã chọn...</p>
            ) : posts.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.3 }}
                className='mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'
              >
                {posts.map((post, index) => (
                  <NearbyPostPreview key={post.id} post={post} index={index} />
                ))}
              </motion.div>
            ) : selectedPoint ? (
              <p className='py-12 text-center text-sm font-semibold text-gray-500'>
                Chưa có bài đăng nào trong bán kính này. Hãy tăng bán kính hoặc chọn vị trí khác.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default NearbyPostsPage
