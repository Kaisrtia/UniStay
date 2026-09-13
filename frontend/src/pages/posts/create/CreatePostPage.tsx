import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import axios from 'axios'
import L from 'leaflet'
import { FaChevronDown, FaImage, FaTimes } from 'react-icons/fa'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'leaflet/dist/leaflet.css'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import { defaultAmenityNames, defaultBenefitNames } from '@/constants/rentalFeatures'
import amenityService, { type Amenity } from '@/services/amenityService'
import { uploadPostImages } from '@/services/cloudinaryService'
import locationService, { type Ward } from '@/services/locationService'
import postService, { type AmenityCondition, type PostPurpose, type RoomType } from '@/services/postService'

const stayTypes: { label: string; value: RoomType }[] = [
  { label: 'Trọ', value: 'ROOM' },
  { label: 'Nhà nguyên căn', value: 'HOUSE' },
  { label: 'Chung cư', value: 'APARTMENT' }
]
const listingPurposes: { label: string; value: PostPurpose }[] = [
  { label: 'Cho thuê', value: 'RENT' },
  { label: 'Cho ở ghép', value: 'FIND_ROOMMATE' }
]

const amenityConditionOptions: { label: string; value: AmenityCondition }[] = [
  { label: 'Mới', value: 'NEW' },
  { label: 'Tốt', value: 'GOOD' },
  { label: 'Cũ', value: 'OLD' }
]

const defaultMapCenter: [number, number] = [16.0544, 108.2022]
const MAX_POST_IMAGES = 10

const mapTileAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const isValidCoordinate = (latitude: number, longitude: number) => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

const fallbackAmenities: Amenity[] = defaultAmenityNames.map((name, index) => ({
  id: index + 1,
  name
}))

const benefits = defaultBenefitNames

type FormSectionProps = {
  children: ReactNode
  title: string
}

const FormSection = ({ children, title }: FormSectionProps) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5 }}
    className='rounded-2xl border border-[#F6D983] bg-white px-8 py-5 shadow-sm'
  >
    <h2 className='text-2xl font-extrabold text-[#111111]'>{title}</h2>
    <div className='mt-4'>{children}</div>
  </motion.section>
)

type PillButtonProps = {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
}

const PillButton = ({ children, onClick, selected = false }: PillButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    type='button'
    onClick={onClick}
    aria-pressed={selected}
    className={`min-w-36 rounded-full px-8 py-3 text-sm font-extrabold text-[#111111] transition ${
      selected
        ? 'bg-[#FFC300] shadow-md shadow-[#001D3D]/15 ring-2 ring-[#001D3D]'
        : 'bg-[#E2E1DD] hover:bg-[#F7DE8B]'
    }`}
  >
    {children}
  </motion.button>
)

type SelectOption = {
  label: string
  value: string | number
}

type MediaPreview = {
  id: string
  file: File
  name: string
  type: string
  url: string
}

type PostFormState = {
  title: string
  detailAddress: string
  exactAddress: string
  city: string
  area: string
  price: string
  deposit: string
  description: string
}

const emptyPostForm: PostFormState = {
  title: '',
  detailAddress: '',
  exactAddress: '',
  city: 'Đà Nẵng',
  area: '',
  price: '',
  deposit: '',
  description: ''
}

type SelectFieldProps = {
  label: string
  name?: string
  value?: string
  options?: SelectOption[]
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

const SelectField = ({ label, name, value, options = [], onChange }: SelectFieldProps) => (
  <label className='flex items-center gap-3'>
    <span className='w-36 shrink-0 whitespace-nowrap text-base font-extrabold text-[#111111]'>{label}</span>
    <span className='relative flex-1'>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className='h-11 w-full appearance-none rounded-full border border-[#001D3D] bg-white px-5 pr-11 text-sm font-semibold text-[#111111] outline-none transition focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
      >
        <option value=''>Chọn {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FaChevronDown className='pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-[#111111]' />
    </span>
  </label>
)

const TextField = ({
  label,
  name,
  placeholder,
  type = 'text',
  value,
  onChange
}: {
  label?: string
  name?: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}) => (
  <label className={label ? 'flex items-center gap-3' : 'block'}>
    {label && <span className='w-36 shrink-0 whitespace-nowrap text-base font-extrabold text-[#111111]'>{label}</span>}
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className='h-11 w-full rounded-full border border-[#001D3D] bg-white px-6 text-sm font-semibold text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
      placeholder={placeholder}
    />
  </label>
)

const CoordinateField = ({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string
  value: string
  min: number
  max: number
  onChange: (value: string) => void
}) => (
  <label className='flex items-center gap-3'>
    <span className='w-36 shrink-0 whitespace-nowrap text-base font-extrabold text-[#111111]'>{label}</span>
    <input
      type='number'
      value={value}
      min={min}
      max={max}
      step='0.000001'
      onChange={(event) => onChange(event.target.value)}
      className='h-11 w-full rounded-full border border-[#001D3D] bg-white px-6 text-sm font-semibold text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
    />
  </label>
)

const CheckboxGrid = ({ items }: { items: string[] }) => (
  <div className='grid gap-x-20 gap-y-2 px-8 text-base text-[#111111] md:grid-cols-2'>
    {items.map((item, index) => (
      <label key={`${item}-${index}`} className='flex items-center gap-1'>
        <input type='checkbox' className='h-4 w-4 accent-[#001D3D]' />
        <span>{item}</span>
      </label>
    ))}
  </div>
)

const AmenityCheckboxGrid = ({
  items,
  selectedIds,
  onToggle
}: {
  items: Amenity[]
  selectedIds: number[]
  onToggle: (amenityId: number) => void
}) => (
  <div className='grid gap-x-20 gap-y-2 px-8 text-base text-[#111111] md:grid-cols-2'>
    {items.map((item) => (
      <label key={item.id} className='flex items-center gap-2'>
        <input
          type='checkbox'
          checked={selectedIds.includes(item.id)}
          onChange={() => onToggle(item.id)}
          className='h-4 w-4 accent-[#001D3D]'
        />
        <span>{item.name}</span>
      </label>
    ))}
  </div>
)

const RecenterPickerMap = ({ center }: { center: [number, number] }) => {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

const LocationClickHandler = ({ onPick }: { onPick: (latitude: number, longitude: number) => void }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    }
  })

  return null
}

const LocationPicker = ({
  latitude,
  longitude,
  onPick
}: {
  latitude: string
  longitude: string
  onPick: (latitude: number, longitude: number) => void
}) => {
  const lat = Number(latitude)
  const lng = Number(longitude)
  const hasCoordinate = latitude.trim() !== '' && longitude.trim() !== ''
  const center = useMemo<[number, number]>(
    () => (hasCoordinate && isValidCoordinate(lat, lng) ? [lat, lng] : defaultMapCenter),
    [hasCoordinate, lat, lng]
  )

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: 'post-location-marker',
        html: '<span class="post-location-marker-dot"></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      }),
    []
  )

  return (
    <div className='relative z-0 isolate overflow-hidden rounded-2xl border border-[#001D3D] bg-white shadow-sm'>
      <MapContainer center={center} zoom={15} scrollWheelZoom={false} style={{ height: 320, width: '100%' }}>
        <RecenterPickerMap center={center} />
        <TileLayer attribution={mapTileAttribution} url='https://tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <LocationClickHandler onPick={onPick} />
        <Marker position={center} icon={markerIcon} />
      </MapContainer>
      <div className='border-t border-gray-100 px-4 py-3 text-sm font-semibold text-gray-600'>
        Bấm vào bản đồ để chọn đúng vị trí kinh độ/vĩ độ cho bài đăng.
      </div>
    </div>
  )
}

const MediaPreviewGrid = ({
  items,
  onRemove
}: {
  items: MediaPreview[]
  onRemove: (previewId: string) => void
}) => {
  if (items.length === 0) {
    return null
  }

  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {items.map((item) => (
        <div
          key={item.id}
          className='group relative overflow-hidden rounded-2xl border border-[#F6D983] bg-white shadow-sm shadow-[#001D3D]/10'
        >
          {item.type.startsWith('video/') ? (
            <video src={item.url} controls className='h-40 w-full bg-[#001D3D] object-cover' />
          ) : (
            <img src={item.url} alt={item.name} className='h-40 w-full object-cover' />
          )}
          <div className='flex items-center justify-between gap-3 px-3 py-2'>
            <span className='truncate text-xs font-bold text-[#111111]'>{item.name}</span>
            <button
              type='button'
              onClick={() => onRemove(item.id)}
              className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#001D3D] text-xs text-white transition hover:bg-red-600'
              aria-label={`Xóa ${item.name}`}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const ExistingMediaGrid = ({
  urls,
  onRemove
}: {
  urls: string[]
  onRemove: (url: string) => void
}) => {
  if (urls.length === 0) {
    return null
  }

  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {urls.map((url) => (
        <div key={url} className='group relative overflow-hidden rounded-2xl border border-[#F6D983] bg-white shadow-sm shadow-[#001D3D]/10'>
          <img src={url} alt='Ảnh bài đăng hiện có' className='h-40 w-full object-cover' />
          <div className='flex items-center justify-between gap-3 px-3 py-2'>
            <span className='truncate text-xs font-bold text-[#111111]'>Ảnh đã lưu</span>
            <button
              type='button'
              onClick={() => onRemove(url)}
              className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#001D3D] text-xs text-white transition hover:bg-red-600'
              aria-label='Xóa ảnh đã lưu'
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

type StoredPostUser = {
  roles?: string[]
}

const getStoredPostUser = () => {
  const rawUser = localStorage.getItem('authUser')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser) as StoredPostUser
  } catch {
    return null
  }
}

const digitsOnly = (value: string) => value.replace(/\D/g, '')

const formatThousands = (value: string) => {
  const digits = digitsOnly(value)
  return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

const parseFormattedNumber = (value: string) => Number(digitsOnly(value) || 0)

const CreatePostPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editPostId = searchParams.get('edit')
  const isEditMode = Boolean(editPostId)
  const [form, setForm] = useState<PostFormState>(emptyPostForm)
  const [roomType, setRoomType] = useState<RoomType>('ROOM')
  const [postPurpose, setPostPurpose] = useState<PostPurpose>('RENT')
  const [wardId, setWardId] = useState('')
  const [wardOptions, setWardOptions] = useState<Ward[]>([])
  const [amenityOptions, setAmenityOptions] = useState<Amenity[]>(fallbackAmenities)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([])
  const [amenityCondition, setAmenityCondition] = useState<AmenityCondition>('GOOD')
  const [latitude, setLatitude] = useState('16.054400')
  const [longitude, setLongitude] = useState('108.202200')
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const mediaPreviewsRef = useRef<MediaPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  const [storedUser] = useState(() => getStoredPostUser())
  const isHostUser = Boolean(storedUser?.roles?.includes('HOST'))
  const isStudentUser = Boolean(storedUser?.roles?.includes('STUDENT'))
  const isRoleLocked = isHostUser || isStudentUser

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const [wards, amenitiesData] = await Promise.all([
          locationService.getWards(),
          amenityService.getAmenities()
        ])
        setWardOptions(wards)
        setAmenityOptions(amenitiesData.length > 0 ? amenitiesData : fallbackAmenities)
      } catch {
        alert('Không tải được danh sách xã/phường hoặc tiện ích.')
      }
    }

    loadFormOptions()
  }, [])

  useEffect(() => {
    if (!editPostId) {
      setForm(emptyPostForm)
      setExistingImageUrls([])
      return
    }

    const loadEditablePost = async () => {
      setLoadingPost(true)

      try {
        const post = await postService.getPostDetail(editPostId)
        if (!post) {
          alert('Không tìm thấy bài đăng cần sửa.')
          navigate('/posts/me')
          return
        }

        setForm({
          title: post.title || '',
          detailAddress: post.detailAddress || '',
          exactAddress: post.exactAddress || '',
          city: post.city || 'Đà Nẵng',
          area: String(post.area || ''),
          price: formatThousands(String(post.price || '')),
          deposit: formatThousands(String(post.deposit || '')),
          description: post.description || ''
        })
        setRoomType((post.roomType || 'ROOM') as RoomType)
        setPostPurpose((post.postPurpose || post.purpose || 'RENT') as PostPurpose)
        setWardId(post.wardId ? String(post.wardId) : '')
        setLatitude(post.latitude !== undefined && post.latitude !== null ? String(post.latitude) : '16.054400')
        setLongitude(post.longitude !== undefined && post.longitude !== null ? String(post.longitude) : '108.202200')
        setExistingImageUrls((post.postImages || []).map((image) => image.imageUrl).filter(Boolean))

        const currentPostAmenities = post.postAmenities || []
        setSelectedAmenityIds(currentPostAmenities.map((item) => Number(item.amenityId)).filter(Number.isFinite))
        const firstCondition = currentPostAmenities.find((item) => item.currentCondition)?.currentCondition
        if (firstCondition) {
          setAmenityCondition(firstCondition)
        }
      } catch {
        alert('Không tải được dữ liệu bài đăng cần sửa.')
        navigate('/posts/me')
      } finally {
        setLoadingPost(false)
      }
    }

    void loadEditablePost()
  }, [editPostId, navigate])

  useEffect(() => {
    if (isHostUser) {
      setPostPurpose('RENT')
      return
    }

    if (isStudentUser) {
      setPostPurpose('FIND_ROOMMATE')
    }
  }, [isHostUser, isStudentUser])

  useEffect(() => {
    mediaPreviewsRef.current = mediaPreviews
  }, [mediaPreviews])

  useEffect(() => {
    return () => {
      mediaPreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [])

  const handleToggleAmenity = (amenityId: number) => {
    setSelectedAmenityIds((current) =>
      current.includes(amenityId) ? current.filter((id) => id !== amenityId) : [...current, amenityId]
    )
  }

  const updateForm = (key: keyof PostFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handlePickLocation = (pickedLatitude: number, pickedLongitude: number) => {
    setLatitude(pickedLatitude.toFixed(6))
    setLongitude(pickedLongitude.toFixed(6))
  }

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    setMediaPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url))

      return files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      }))
    })

    event.target.value = ''
  }

  const handleRemoveMediaPreview = (previewId: string) => {
    setMediaPreviews((current) => {
      const previewToRemove = current.find((preview) => preview.id === previewId)
      if (previewToRemove) {
        URL.revokeObjectURL(previewToRemove.url)
      }

      return current.filter((preview) => preview.id !== previewId)
    })
  }

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImageUrls((current) => current.filter((url) => url !== imageUrl))
  }

  const getBackendErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
      return data?.error?.message || data?.message || (isEditMode ? 'Cập nhật bài đăng thất bại.' : 'Tạo bài đăng thất bại.')
    }

    if (error instanceof Error) {
      return error.message
    }

    return isEditMode ? 'Cập nhật bài đăng thất bại.' : 'Tạo bài đăng thất bại.'
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) {
      return
    }

    if (!wardId) {
      alert('Vui lòng chọn xã/phường.')
      return
    }

    if (!form.exactAddress.trim() || !form.city.trim()) {
      alert('Vui lòng nhập đầy đủ địa chỉ chính xác và thành phố.')
      return
    }

    const latitudeValue = Number(latitude)
    const longitudeValue = Number(longitude)

    if (!isValidCoordinate(latitudeValue, longitudeValue)) {
      alert('Vui lòng chọn tọa độ hợp lệ trên bản đồ.')
      return
    }

    if (existingImageUrls.length + mediaPreviews.length > MAX_POST_IMAGES) {
      toast.error(`Mỗi bài đăng chỉ được tối đa ${MAX_POST_IMAGES} ảnh. Vui lòng xóa bớt ảnh trước khi đăng.`)
      return
    }

    setLoading(true)

    try {
      const uploadedImageUrls =
        mediaPreviews.length > 0 ? await uploadPostImages(mediaPreviews.map((preview) => preview.file)) : []
      const purposeValue: PostPurpose = isStudentUser ? 'FIND_ROOMMATE' : 'RENT'

      const payload = {
        title: form.title.trim(),
        wardId: Number(wardId),
        purpose: purposeValue,
        detailAddress: `${form.exactAddress.trim()}, ${form.city.trim()}`,
        exactAddress: form.exactAddress.trim(),
        city: form.city.trim(),
        area: Number(form.area || 0),
        price: parseFormattedNumber(form.price),
        deposit: parseFormattedNumber(form.deposit),
        roomType,
        postPurpose: purposeValue,
        description: form.description.trim(),
        latitude: latitudeValue,
        longitude: longitudeValue,
        postImages: isEditMode ? [...existingImageUrls, ...uploadedImageUrls] : uploadedImageUrls,
        postAmenities: selectedAmenityIds.map((amenityId) => ({
          amenityId,
          currentCondition: amenityCondition
        }))
      }

      const response =
        isEditMode && editPostId ? await postService.updatePost(editPostId, payload) : await postService.createPost(payload)

      alert(response.message || (isEditMode ? 'Cập nhật bài đăng thành công.' : 'Tạo bài đăng thành công.'))
      navigate(isEditMode ? '/posts/me' : '/home')
    } catch (error) {
      alert(getBackendErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#F6F7F9] text-[#111111]'>
      <SiteHeader accountLabel='Host' />

      <main className='px-6 py-10'>
        <h1 className='text-center text-4xl font-extrabold tracking-wide text-[#6F5616]'>
          {isEditMode ? 'SỬA BÀI ĐĂNG' : 'ĐĂNG TIN'}
        </h1>

        {loadingPost ? (
          <section className='mx-auto mt-5 max-w-[1000px] rounded-2xl bg-white p-8 text-center font-bold text-gray-500 shadow-sm'>
            Đang tải dữ liệu bài đăng...
          </section>
        ) : (
        <form onSubmit={handleSubmit} className='mx-auto mt-5 grid max-w-[1000px] gap-6'>
          <FormSection title='Loại trọ'>
            <div className='grid gap-4'>
              <div className='flex flex-wrap gap-5 pl-8'>
                  {stayTypes.map((type) => (
                  <PillButton
                    key={type.value}
                    selected={roomType === type.value}
                    onClick={() => setRoomType(type.value)}
                  >
                    {type.label}
                  </PillButton>
                ))}
              </div>

              <div>
                <h3 className='text-2xl font-extrabold text-[#111111]'>Tôi muốn</h3>
                <div className='mt-4 flex flex-wrap gap-5 pl-8'>
                  {listingPurposes.map((purpose) => (
                    <PillButton
                      key={purpose.value}
                      selected={postPurpose === purpose.value}
                      onClick={() => {
                        if (!isRoleLocked) setPostPurpose(purpose.value)
                      }}
                    >
                      {purpose.label}
                    </PillButton>
                  ))}
                </div>
                {isRoleLocked ? (
                  <p className='mt-3 pl-8 text-sm font-semibold text-[#6F5616]'>
                    Loại bài đăng được tự động áp dụng theo vai trò tài khoản hiện tại.
                  </p>
                ) : null}
              </div>
            </div>
          </FormSection>

          <FormSection title='Vị trí'>
            <div className='grid gap-5 px-8'>
              <div className='grid gap-6'>
                <SelectField
                  label='Xã/Phường'
                  name='wardId'
                  value={wardId}
                  onChange={(event) => setWardId(event.target.value)}
                  options={wardOptions.map((ward) => ({ label: ward.name, value: ward.id }))}
                />
              </div>
              <TextField
                label='Số nhà, đường'
                name='exactAddress'
                value={form.exactAddress}
                onChange={(event) => updateForm('exactAddress', event.target.value)}
              />
              <TextField
                label='Thành phố'
                name='city'
                value={form.city}
                onChange={(event) => updateForm('city', event.target.value)}
              />
            </div>
          </FormSection>

          <FormSection title='Đặc điểm'>
            <div className='grid gap-6 px-8 md:grid-cols-2'>
              <TextField
                label='Diện tích'
                name='area'
                type='number'
                value={form.area}
                onChange={(event) => updateForm('area', event.target.value)}
              />
              <SelectField
                label='Tình trạng nội thất'
                name='amenityCondition'
                value={amenityCondition}
                onChange={(event) => setAmenityCondition((event.target.value || 'GOOD') as AmenityCondition)}
                options={amenityConditionOptions}
              />
              <CoordinateField label='Vĩ độ' value={latitude} min={-90} max={90} onChange={setLatitude} />
              <CoordinateField label='Kinh độ' value={longitude} min={-180} max={180} onChange={setLongitude} />
              <div className='md:col-span-2'>
                <LocationPicker latitude={latitude} longitude={longitude} onPick={handlePickLocation} />
              </div>
            </div>
          </FormSection>

          <FormSection title='Nội dung'>
            <div className='grid gap-5 px-8'>
              <label
                htmlFor='post-media-upload'
                className='flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl bg-[#FFE9A6] text-[#6F5616] shadow-md shadow-[#001D3D]/20 transition hover:bg-[#F7DE8B]'
              >
                <span className='grid h-12 w-12 place-items-center rounded-xl bg-white text-2xl text-[#FFC300]'>
                  <FaImage />
                </span>
                <span className='mt-2 text-sm font-bold'>Thêm ảnh</span>
                <span className='mt-1 text-xs font-semibold text-[#6F5616]/70'>
                  {mediaPreviews.length > 0 ? `${mediaPreviews.length} file đã chọn` : 'Chọn ảnh để xem trước'}
                </span>
                <input
                  id='post-media-upload'
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handleMediaChange}
                  className='sr-only'
                />
              </label>

              <ExistingMediaGrid urls={existingImageUrls} onRemove={handleRemoveExistingImage} />
              <MediaPreviewGrid items={mediaPreviews} onRemove={handleRemoveMediaPreview} />

              <TextField
                name='title'
                placeholder='Tiêu đề'
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
              />
              <TextField
                name='price'
                placeholder='Giá thuê'
                value={form.price}
                onChange={(event) => updateForm('price', formatThousands(event.target.value))}
              />
              <TextField
                name='deposit'
                placeholder='Tiền cọc'
                value={form.deposit}
                onChange={(event) => updateForm('deposit', formatThousands(event.target.value))}
              />
              <textarea
                name='description'
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                className='min-h-52 resize-none rounded-2xl border border-[#001D3D] bg-white px-6 py-5 text-sm font-semibold text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#FFC300] focus:ring-2 focus:ring-[#FFC300]/30'
                placeholder='Mô tả'
              />
            </div>
          </FormSection>

          <FormSection title='Tiện ích'>
            <AmenityCheckboxGrid
              items={amenityOptions}
              selectedIds={selectedAmenityIds}
              onToggle={handleToggleAmenity}
            />
          </FormSection>

          <FormSection title='Lợi ích'>
            <CheckboxGrid items={benefits} />
          </FormSection>

          <div className='mx-auto grid w-full max-w-[720px] gap-8 pt-4 md:grid-cols-2'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='w-full'>
              <Link
                to='/home'
                className='block w-full rounded-2xl bg-white px-8 py-5 text-center text-2xl font-extrabold text-[#111111] shadow-md shadow-[#001D3D]/15 transition hover:shadow-lg hover:shadow-[#001D3D]/20'
              >
                THOÁT
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type='submit'
              disabled={loading}
              className='w-full rounded-2xl bg-[#FFE9A6] px-8 py-5 text-2xl font-extrabold text-[#111111] shadow-md shadow-[#001D3D]/15 transition hover:bg-[#F7DE8B] hover:shadow-lg hover:shadow-[#001D3D]/20 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {loading ? 'ĐANG XỬ LÝ' : isEditMode ? 'CẬP NHẬT' : 'ĐĂNG BÀI'}
            </motion.button>
          </div>
        </form>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

export default CreatePostPage
