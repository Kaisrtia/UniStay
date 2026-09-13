import { type FormEvent, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { FaArrowLeft, FaBolt, FaCheckCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import { defaultAmenityNames, defaultBenefitNames } from '@/constants/rentalFeatures'
import amenityService, { type Amenity } from '@/services/amenityService'
import demandService, { type DemandPriority, type SavedDemand } from '@/services/demandService'
import locationService, { type University } from '@/services/locationService'
import postService, { type Post, type RoomType } from '@/services/postService'

const fallbackAmenities: Amenity[] = defaultAmenityNames.map((name, index) => ({
  id: index + 1,
  name
}))

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const moneyInputFormatter = new Intl.NumberFormat('vi-VN')

const parseMoneyInput = (value: string) => Number(value.replace(/\D/g, ''))

const formatMoneyInput = (value: string | number) => {
  const directNumber = typeof value === 'number' ? value : Number(value)
  const numericValue = Number.isFinite(directNumber) ? directNumber : parseMoneyInput(String(value))
  return numericValue > 0 ? moneyInputFormatter.format(numericValue) : ''
}

const parseOptionalNumberInput = (value: FormDataEntryValue | null) => {
  const normalizedValue = String(value || '').trim().replace(',', '.')
  if (!normalizedValue) return undefined

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

const priorityOptions: { label: string; value: DemandPriority }[] = [
  { label: 'Thấp', value: 'LOW' },
  { label: 'Trung bình', value: 'MEDIUM' },
  { label: 'Cao', value: 'HIGH' }
]

const PrioritySelect = ({
  value,
  onChange
}: {
  value: DemandPriority
  onChange: (value: DemandPriority) => void
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value as DemandPriority)}
    className='h-9 rounded-full border border-gray-200 bg-white px-3 text-xs font-extrabold text-[#003566] outline-none focus:ring-2 focus:ring-[#FFC300]'
  >
    {priorityOptions.map((option) => (
      <option key={option.value} value={option.value}>
        {option.value} - {option.label}
      </option>
    ))}
  </select>
)

const FieldHeader = ({
  label,
  priority,
  onPriorityChange
}: {
  label: string
  priority: DemandPriority
  onPriorityChange: (value: DemandPriority) => void
}) => (
  <div className='flex flex-wrap items-center justify-between gap-2'>
    <span className='text-sm font-bold'>{label}</span>
    <PrioritySelect value={priority} onChange={onPriorityChange} />
  </div>
)

const getDemandAmenityIds = (demand: SavedDemand) =>
  demand.student?.demandAmenities
    ?.map((item) => Number(item.amenityId ?? item.amenity?.id))
    .filter((item) => Number.isInteger(item)) ?? []

const getSavedPriority = (value?: DemandPriority | null): DemandPriority => value || 'MEDIUM'

const DemandPage = () => {
  const [universities, setUniversities] = useState<University[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>(fallbackAmenities)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([])
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [universityId, setUniversityId] = useState('')
  const [locationRadiusKm, setLocationRadiusKm] = useState('3')
  const [minPriceDisplay, setMinPriceDisplay] = useState(formatMoneyInput(1500000))
  const [maxPriceDisplay, setMaxPriceDisplay] = useState(formatMoneyInput(3500000))
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')
  const [roomType, setRoomType] = useState<RoomType>('ROOM')
  const [isLookingForRoommate, setIsLookingForRoommate] = useState(false)
  const [locationPriority, setLocationPriority] = useState<DemandPriority>('MEDIUM')
  const [pricePriority, setPricePriority] = useState<DemandPriority>('MEDIUM')
  const [areaPriority, setAreaPriority] = useState<DemandPriority>('MEDIUM')
  const [roomTypePriority, setRoomTypePriority] = useState<DemandPriority>('MEDIUM')
  const [roommatePriority, setRoommatePriority] = useState<DemandPriority>('MEDIUM')
  const [amenityPriority, setAmenityPriority] = useState<DemandPriority>('MEDIUM')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const applySavedDemand = (demand: SavedDemand) => {
    setUniversityId(demand.universityId || '')
    setLocationRadiusKm(String(Number(demand.locationRadiusMeters || 3000) / 1000))
    setMinPriceDisplay(formatMoneyInput(demand.minPrice))
    setMaxPriceDisplay(formatMoneyInput(demand.maxPrice))
    setMinArea(demand.minArea ? String(demand.minArea) : '')
    setMaxArea(demand.maxArea ? String(demand.maxArea) : '')
    setRoomType(demand.roomType || 'ROOM')
    setIsLookingForRoommate(Boolean(demand.isLookingForRoommate))
    setLocationPriority(getSavedPriority(demand.locationPriority))
    setPricePriority(getSavedPriority(demand.pricePriority))
    setAreaPriority(getSavedPriority(demand.areaPriority))
    setRoomTypePriority(getSavedPriority(demand.roomTypePriority))
    setRoommatePriority(getSavedPriority(demand.roommatePriority))
    setAmenityPriority(getSavedPriority(demand.amenityPriority))
    setSelectedAmenityIds(getDemandAmenityIds(demand))

    const savedCriteria = String(demand.rommateCriteria || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    setSelectedBenefits(defaultBenefitNames.filter((benefit) => savedCriteria.includes(benefit)))
  }

  useEffect(() => {
    const loadInitialData = async () => {
      const [universityResult, amenityResult, demandResult] = await Promise.allSettled([
        locationService.getUniversities(),
        amenityService.getAmenities(),
        demandService.getMyDemand()
      ])

      if (universityResult.status === 'fulfilled') setUniversities(universityResult.value)
      if (amenityResult.status === 'fulfilled' && amenityResult.value.length > 0) setAmenities(amenityResult.value)
      if (demandResult.status === 'fulfilled' && demandResult.value) applySavedDemand(demandResult.value)
    }

    void loadInitialData()
  }, [])

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const recommendations = await postService.getRecommendedPosts({ limit: 4 })
        setRecommendedPosts(recommendations.data)
      } catch {
        setRecommendedPosts([])
      }
    }

    void loadRecommendations()
  }, [])

  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenityIds((current) =>
      current.includes(amenityId) ? current.filter((id) => id !== amenityId) : [...current, amenityId]
    )
  }

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits((current) =>
      current.includes(benefit) ? current.filter((item) => item !== benefit) : [...current, benefit]
    )
  }

  const handleMoneyInputChange = (value: string, setter: (nextValue: string) => void) => {
    setter(formatMoneyInput(value))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    const selectedAmenityNames = amenities
      .filter((amenity) => selectedAmenityIds.includes(amenity.id))
      .map((amenity) => amenity.name)
    const criteria = [...selectedAmenityNames, ...selectedBenefits].join(', ')
    const selectedUniversityId = universityId
    const parsedLocationRadiusKm = Number(locationRadiusKm || 3)
    const locationRadiusMeters = Math.round(parsedLocationRadiusKm * 1000)
    const parsedMinArea = parseOptionalNumberInput(minArea)
    const parsedMaxArea = parseOptionalNumberInput(maxArea)

    if (!selectedUniversityId) {
      setErrorMessage('Hãy chọn trường đại học muốn ở gần.')
      return
    }

    if (!Number.isFinite(parsedLocationRadiusKm) || locationRadiusMeters <= 0) {
      setErrorMessage('Bán kính quanh trường phải lớn hơn 0.')
      return
    }

    if (parsedMinArea !== undefined && parsedMaxArea !== undefined && parsedMinArea > parsedMaxArea) {
      setErrorMessage('Diện tích tối thiểu không được lớn hơn diện tích tối đa.')
      return
    }

    try {
      await demandService.createOrUpdateDemand({
        universityId: selectedUniversityId,
        locationRadiusMeters,
        minPrice: parseMoneyInput(minPriceDisplay),
        maxPrice: parseMoneyInput(maxPriceDisplay),
        minArea: parsedMinArea,
        maxArea: parsedMaxArea,
        roomType,
        isLookingForRoommate,
        roommateGender: 'ANY',
        rommateCriteria: criteria || 'Không có tiêu chí thêm',
        amenityIds: selectedAmenityIds,
        locationPriority,
        pricePriority,
        areaPriority,
        roomTypePriority,
        roommatePriority,
        amenityPriority
      })

      const recommendations = await postService.getRecommendedPosts({ limit: 4 })
      setRecommendedPosts(recommendations.data)
      setMessage('Đã lưu nhu cầu thuê và cập nhật gợi ý phù hợp.')
    } catch {
      setErrorMessage('Không lưu được nhu cầu. Hãy đăng nhập bằng tài khoản sinh viên.')
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-7xl px-8 py-10'>
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
          <h1 className='mt-3 text-4xl font-black'>Nhu cầu thuê phòng</h1>
          <p className='mt-3 max-w-2xl text-gray-500'>
            Lưu ngân sách, trường muốn ở gần, bán kính tìm kiếm, diện tích và tiện ích để hệ thống ưu tiên bài đăng phù hợp nhất.
          </p>
        </motion.div>

        <section className='mt-8 grid gap-8 lg:grid-cols-[520px_minmax(0,1fr)]'>
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit} 
            className='rounded-2xl bg-white p-7 shadow-lg shadow-[#001D3D]/5'
          >
            <div className='grid gap-5'>
              <section className='grid gap-3'>
                <FieldHeader label='Vị trí' priority={locationPriority} onPriorityChange={setLocationPriority} />
                <label className='grid gap-2 text-sm font-bold'>
                  Gần trường đại học
                  <select
                    name='universityId'
                    required
                    value={universityId}
                    onChange={(event) => setUniversityId(event.target.value)}
                    className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                  >
                    <option value=''>Chọn trường</option>
                    {universities.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className='grid gap-2 text-sm font-bold'>
                  Bán kính quanh trường (km)
                  <input
                    name='locationRadiusKm'
                    type='number'
                    min='0.5'
                    step='0.5'
                    value={locationRadiusKm}
                    onChange={(event) => setLocationRadiusKm(event.target.value)}
                    required
                    className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                    placeholder='3'
                  />
                </label>
              </section>

              <section className='grid gap-3'>
                <FieldHeader label='Giá' priority={pricePriority} onPriorityChange={setPricePriority} />
                <div className='grid gap-4 sm:grid-cols-2'>
                  <label className='grid gap-2 text-sm font-bold'>
                    Giá tối thiểu
                    <input
                      name='minPrice'
                      type='text'
                      inputMode='numeric'
                      value={minPriceDisplay}
                      onChange={(event) => handleMoneyInputChange(event.target.value, setMinPriceDisplay)}
                      className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                      placeholder='1.500.000'
                    />
                  </label>
                  <label className='grid gap-2 text-sm font-bold'>
                    Giá tối đa
                    <input
                      name='maxPrice'
                      type='text'
                      inputMode='numeric'
                      value={maxPriceDisplay}
                      onChange={(event) => handleMoneyInputChange(event.target.value, setMaxPriceDisplay)}
                      className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                      placeholder='3.500.000'
                    />
                  </label>
                </div>
              </section>

              <section className='grid gap-3'>
                <FieldHeader label='Diện tích' priority={areaPriority} onPriorityChange={setAreaPriority} />
                <div className='grid gap-4 sm:grid-cols-2'>
                  <label className='grid gap-2 text-sm font-bold'>
                    Diện tích tối thiểu (m²)
                    <input
                      name='minArea'
                      type='number'
                      inputMode='decimal'
                      min='1'
                      step='0.5'
                      value={minArea}
                      onChange={(event) => setMinArea(event.target.value)}
                      className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                      placeholder='18'
                    />
                  </label>
                  <label className='grid gap-2 text-sm font-bold'>
                    Diện tích tối đa (m²)
                    <input
                      name='maxArea'
                      type='number'
                      inputMode='decimal'
                      min='1'
                      step='0.5'
                      value={maxArea}
                      onChange={(event) => setMaxArea(event.target.value)}
                      className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                      placeholder='35'
                    />
                  </label>
                </div>
              </section>

              <section className='grid gap-2'>
                <FieldHeader label='Loại phòng' priority={roomTypePriority} onPriorityChange={setRoomTypePriority} />
                <select
                  name='roomType'
                  value={roomType}
                  onChange={(event) => setRoomType(event.target.value as RoomType)}
                  className='h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#FFC300]'
                >
                  <option value='ROOM'>Phòng trọ</option>
                  <option value='APARTMENT'>Căn hộ</option>
                  <option value='HOUSE'>Nhà nguyên căn</option>
                </select>
              </section>

              <section className='grid gap-2'>
                <FieldHeader
                  label='Mục đích tìm bạn ở ghép'
                  priority={roommatePriority}
                  onPriorityChange={setRoommatePriority}
                />
                <label className='flex items-center gap-3 rounded-xl bg-[#FFF7D6] px-4 py-3 text-sm font-bold'>
                  <input
                    name='isLookingForRoommate'
                    type='checkbox'
                    checked={isLookingForRoommate}
                    onChange={(event) => setIsLookingForRoommate(event.target.checked)}
                    className='accent-[#FFC300]'
                  />
                  Tôi đang tìm bạn ở ghép
                </label>
              </section>

              <section className='grid gap-3'>
                <FieldHeader
                  label='Tiện ích mong muốn'
                  priority={amenityPriority}
                  onPriorityChange={setAmenityPriority}
                />
                <div className='grid gap-2 sm:grid-cols-2'>
                  {amenities.map((amenity) => (
                    <label
                      key={amenity.id}
                      className='flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-sm font-bold'
                    >
                      <input
                        type='checkbox'
                        checked={selectedAmenityIds.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className='h-4 w-4 accent-[#001D3D]'
                      />
                      {amenity.name}
                    </label>
                  ))}
                </div>
              </section>

              <section className='grid gap-3'>
                <h2 className='text-sm font-bold'>Lợi ích ưu tiên</h2>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {defaultBenefitNames.map((benefit) => (
                    <label
                      key={benefit}
                      className='flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-sm font-bold'
                    >
                      <input
                        type='checkbox'
                        checked={selectedBenefits.includes(benefit)}
                        onChange={() => toggleBenefit(benefit)}
                        className='h-4 w-4 accent-[#001D3D]'
                      />
                      {benefit}
                    </label>
                  ))}
                </div>
              </section>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit' 
                className='rounded-xl bg-[#001D3D] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#003566]'
              >
                Lưu nhu cầu và xem gợi ý
              </motion.button>
            </div>
            {message ? (
              <p className='mt-4 flex items-center gap-2 text-sm font-bold text-green-600'>
                <FaCheckCircle />
                {message}
              </p>
            ) : null}
            {errorMessage ? <p className='mt-4 text-sm font-bold text-red-600'>{errorMessage}</p> : null}
          </motion.form>

          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className='rounded-2xl bg-white p-7 shadow-lg shadow-[#001D3D]/5'
          >
            <div className='flex items-center justify-between gap-5'>
              <h2 className='text-2xl font-black'>Gợi ý phù hợp</h2>
              <FaBolt className='text-2xl text-[#FFC300]' />
            </div>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              <AnimatePresence>
                {recommendedPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Link
                      to={`/posts/${post.id}`}
                      className='block h-full rounded-xl border border-gray-100 p-4 transition hover:-translate-y-0.5 hover:border-[#FFC300] hover:shadow-lg hover:shadow-[#001D3D]/10'
                    >
                      <p className='text-xs font-extrabold uppercase text-[#FFC300]'>{post.roomType}</p>
                      <h3 className='mt-2 line-clamp-2 text-lg font-extrabold'>{post.title}</h3>
                      <p className='mt-2 text-sm text-gray-500'>{post.ward?.name || post.detailAddress}</p>
                      <p className='mt-3 font-black text-[#003566]'>{currencyFormatter.format(Number(post.price || 0))}</p>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
              {recommendedPosts.length === 0 ? (
                <p className='rounded-xl bg-gray-50 p-5 text-sm font-bold text-gray-500 sm:col-span-2'>
                  Chưa có gợi ý. Hãy lưu nhu cầu thuê trước.
                </p>
              ) : null}
            </div>
          </motion.section>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default DemandPage
