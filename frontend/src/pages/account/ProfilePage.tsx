import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  FaArrowLeft,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaIdCard,
  FaPhoneAlt,
  FaSave,
  FaSpinner,
  FaUniversity,
  FaUser
} from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { SiteFooter, SiteHeader } from '@/components/layout/site-layout'
import { uploadAvatarImage } from '@/services/cloudinaryService'
import locationService from '@/services/locationService'
import userService, { type AuthenticatedUserProfile } from '@/services/userService'

type ProfileFormState = {
  fullName: string
  phone: string
  dob: string
  gender: string
  avatarUrl: string
  universityId: string
}

type ProfileFieldErrors = Partial<Record<'fullName' | 'email' | 'phone', string>>

const emptyForm: ProfileFormState = {
  fullName: '',
  phone: '',
  dob: '',
  gender: '',
  avatarUrl: '',
  universityId: ''
}

const roleLabels: Record<string, string> = {
  USER: 'Người dùng',
  STUDENT: 'Sinh viên',
  HOST: 'Chủ trọ',
  ADMIN: 'Quản trị viên'
}

const genderLabels: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác'
}

const formatDateInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<AuthenticatedUserProfile | null>(null)
  const [form, setForm] = useState<ProfileFormState>(emptyForm)
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})

  const isStudent = Boolean(profile?.roles?.includes('STUDENT'))
  const isHost = Boolean(profile?.roles?.includes('HOST'))
  const isStudentForm = isStudent
  const hostInfo = profile?.hosts?.[0]

  const roleText = useMemo(
    () => profile?.roles?.map((role) => roleLabels[role] || role).join(', ') || 'Người dùng',
    [profile?.roles]
  )
  const avatarPreview = form.avatarUrl || profile?.avatarUrl || ''

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const [currentProfile, universityOptions] = await Promise.all([
          userService.getMyProfile(),
          locationService.getUniversities()
        ])

        if (currentProfile) {
          setProfile(currentProfile)
          setForm({
            fullName: currentProfile.fullName || '',
            phone: currentProfile.phone || '',
            dob: formatDateInput(currentProfile.dob),
            gender: currentProfile.gender || '',
            avatarUrl: currentProfile.avatarUrl || '',
            universityId: currentProfile.student?.universityId || ''
          })
        }

        setUniversities(universityOptions)
      } catch {
        setError('Không tải được thông tin cá nhân. Vui lòng đăng nhập lại.')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  const validateProfileForm = () => {
    const nextErrors: ProfileFieldErrors = {}

    if (!form.fullName.trim()) nextErrors.fullName = 'Họ và tên không được để trống.'
    if (!profile?.email?.trim()) nextErrors.email = 'Email không được để trống.'
    if (!form.phone.trim()) nextErrors.phone = 'Số điện thoại không được để trống.'

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setFieldErrors({})

    if (!validateProfileForm()) return

    setSaving(true)

    try {
      const updatePayload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        ...(form.dob && { dob: form.dob }),
        ...(form.gender && { gender: form.gender }),
        ...(form.avatarUrl.trim() && { avatarUrl: form.avatarUrl.trim() }),
        ...(isStudent && form.universityId && { universityId: form.universityId })
      }

      await userService.updateProfile(updatePayload)

      const refreshedProfile = await userService.getMyProfile()
      if (refreshedProfile) {
        setProfile(refreshedProfile)
        localStorage.setItem(
          'authUser',
          JSON.stringify({
            id: refreshedProfile.id,
            email: refreshedProfile.email,
            fullName: refreshedProfile.fullName,
            phone: refreshedProfile.phone,
            avatarUrl: refreshedProfile.avatarUrl,
            status: refreshedProfile.status,
            roles: refreshedProfile.roles
          })
        )
        window.dispatchEvent(new Event('auth-user-updated'))
      }

      setIsEditing(false)
      setMessage('Đã cập nhật thông tin cá nhân.')
    } catch {
      setError('Không thể cập nhật thông tin. Vui lòng kiểm tra lại các trường đã nhập.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setError('')
    setMessage('')

    try {
      const avatarUrl = await uploadAvatarImage(file)
      setForm((current) => ({ ...current, avatarUrl }))
      setMessage('Đã tải ảnh đại diện lên. Bấm lưu để cập nhật hồ sơ.')
    } catch {
      setError('Không thể tải ảnh đại diện lên Cloudinary. Vui lòng kiểm tra cấu hình upload và thử lại.')
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <SiteHeader />
      <main className='mx-auto max-w-6xl px-8 py-10'>
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
            <h1 className='mt-3 text-4xl font-black'>Thông tin cá nhân</h1>
            <p className='mt-3 max-w-2xl text-gray-500'>
              Quản lý thông tin liên hệ và hồ sơ hiển thị khi bạn tương tác với bài đăng.
            </p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type='button'
            onClick={() => setIsEditing((current) => !current)}
            className='inline-flex items-center gap-3 rounded-full bg-[#FFC300] px-6 py-3 text-sm font-extrabold text-[#001D3D] shadow-lg shadow-[#FFC300]/20 transition hover:bg-[#FFD60A]'
          >
            <FaEdit />
            {isEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa'}
          </motion.button>
        </div>

        {message ? (
          <p className='mt-6 rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700'>{message}</p>
        ) : null}
        {error ? <p className='mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600'>{error}</p> : null}

        {loading ? (
          <section className='mt-8 grid min-h-[320px] place-items-center rounded-2xl bg-white p-10 shadow-lg shadow-[#001D3D]/5'>
            <FaSpinner className='animate-spin text-4xl text-[#001D3D]' aria-label='Đang tải' />
          </section>
        ) : profile ? (
          <AnimatePresence>
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]'
            >
              <aside className='rounded-2xl bg-white p-6 shadow-lg shadow-[#001D3D]/5'>
                <div className='flex flex-col items-center text-center'>
                  <div className='grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-[#001D3D] text-3xl font-black text-[#FFC300]'>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt={profile.fullName} className='h-full w-full object-cover' />
                    ) : (
                      profile.fullName?.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <h2 className='mt-4 text-2xl font-black'>{profile.fullName}</h2>
                  <span className='mt-3 inline-flex items-center gap-2 rounded-full bg-[#FFF7D6] px-4 py-2 text-xs font-extrabold text-[#6F5616]'>
                    <FaIdCard />
                    {roleText}
                  </span>
                  {isHost && hostInfo?.isVerified ? (
                    <span className='mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-extrabold text-green-700'>
                      <FaCheckCircle />
                      Chủ trọ đã xác minh
                    </span>
                  ) : null}
                </div>
  
                <div className='mt-6 grid gap-3 text-sm'>
                  <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                    <FaEnvelope className='text-[#003566]' />
                    <span className='min-w-0 truncate font-bold'>{profile.email}</span>
                  </div>
                  <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                    <FaPhoneAlt className='text-[#003566]' />
                    <span className='font-bold'>{profile.phone || 'Chưa cập nhật số điện thoại'}</span>
                  </div>
                  {isStudentForm ? (
                    <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                      <FaUniversity className='text-[#003566]' />
                      <span className='font-bold'>{profile.student?.university?.name || 'Chưa chọn trường học'}</span>
                    </div>
                  ) : null}
                  {isHost ? (
                    <div className='flex items-center gap-3 rounded-xl bg-[#F5F7FA] px-4 py-3'>
                      <FaIdCard className='text-[#003566]' />
                      <span className='font-bold'>Tổng bài đăng: {hostInfo?.totalPost || 0}</span>
                    </div>
                  ) : null}
                </div>
              </aside>
  
              <form onSubmit={handleSubmit} className='min-w-0 rounded-2xl bg-white p-6 shadow-lg shadow-[#001D3D]/5'>
                <div className='grid min-w-0 gap-5 md:grid-cols-2'>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Họ và tên
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  />
                  {fieldErrors.fullName ? (
                    <span className='text-xs font-bold text-red-600'>{fieldErrors.fullName}</span>
                  ) : null}
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Email
                  <input
                    value={profile.email}
                    disabled
                    className='w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none'
                  />
                  {fieldErrors.email ? (
                    <span className='text-xs font-bold text-red-600'>{fieldErrors.email}</span>
                  ) : null}
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Số điện thoại
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  />
                  {fieldErrors.phone ? (
                    <span className='text-xs font-bold text-red-600'>{fieldErrors.phone}</span>
                  ) : null}
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Ngày sinh
                  <input
                    type='date'
                    value={form.dob}
                    onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  />
                </label>
                <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                  Giới tính
                  <select
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                    disabled={!isEditing}
                    className='w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                  >
                    <option value=''>Chưa cập nhật</option>
                    {Object.entries(genderLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {isStudentForm ? (
                  <label className='grid min-w-0 gap-2 text-sm font-extrabold'>
                    Trường học
                    <select
                      value={form.universityId}
                      onChange={(event) => setForm((current) => ({ ...current, universityId: event.target.value }))}
                      disabled={!isEditing}
                      className='w-full min-w-0 truncate rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300] disabled:bg-gray-50'
                    >
                      <option value=''>Chọn trường học</option>
                      {universities.map((university) => (
                        <option key={university.id} value={university.id}>
                          {university.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className='grid min-w-0 gap-2 text-sm font-extrabold md:col-span-2'>
                  Ảnh đại diện
                  <div className='flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4'>
                    <input
                      id='avatar-upload'
                      type='file'
                      accept='image/*'
                      onChange={(event) => void handleAvatarFileChange(event)}
                      disabled={!isEditing || uploadingAvatar}
                      className='hidden'
                    />
                    <label
                      htmlFor='avatar-upload'
                      className={`inline-flex cursor-pointer rounded-full px-5 py-2 text-sm font-extrabold transition ${
                        isEditing && !uploadingAvatar
                          ? 'bg-[#FFC300] text-[#001D3D] hover:bg-[#FFD60A]'
                          : 'cursor-not-allowed bg-gray-200 text-gray-500'
                      }`}
                    >
                      {uploadingAvatar ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
                    </label>
                    <span className='min-w-0 flex-1 truncate text-sm font-bold text-gray-500'>
                      {form.avatarUrl ? 'Ảnh đại diện đã sẵn sàng để lưu.' : 'Chọn ảnh JPG, PNG hoặc WebP.'}
                    </span>
                  </div>
                </label>
              </div>

              <div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5'>
                <span className='inline-flex items-center gap-2 text-sm font-bold text-gray-500'>
                  <FaUser className='text-[#FFC300]' />
                  Thông tin này được dùng khi liên hệ thuê phòng hoặc quản lý bài đăng.
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type='submit'
                  disabled={!isEditing || saving}
                  className='inline-flex items-center gap-3 rounded-full bg-[#001D3D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:bg-gray-300'
                >
                  <FaSave />
                  {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                </motion.button>
              </div>
            </form>
          </motion.section>
        </AnimatePresence>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}

export default ProfilePage
