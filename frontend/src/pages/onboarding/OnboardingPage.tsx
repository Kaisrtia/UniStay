import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import axios from 'axios'
import { motion } from 'framer-motion'
import { FaArrowLeft, FaCheck, FaHome, FaPhoneAlt, FaSpinner, FaUniversity, FaUserGraduate } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

import { logo } from '@/assets/images'
import locationService from '@/services/locationService'
import userService, { type AuthenticatedUserProfile } from '@/services/userService'
import { clearAuthSession } from '@/utils/authSession'

type SetupRole = 'STUDENT' | 'HOST'

type OnboardingForm = {
  phone: string
  dob: string
  gender: string
  universityId: string
}

type FieldErrors = Partial<Record<keyof OnboardingForm | 'role', string>>

const roleOptions: Array<{
  value: SetupRole
  title: string
  subtitle: string
  icon: typeof FaUserGraduate
  features: string[]
}> = [
  {
    value: 'STUDENT',
    title: 'Sinh viên',
    subtitle: 'Các tính năng nổi bật dành cho sinh viên',
    icon: FaUserGraduate,
    features: [
      'Đăng tin tìm bạn ở ghép',
      'Tạo nhu cầu tìm phòng',
      'Gợi ý bài đăng phù hợp',
      'Gửi yêu cầu thuê hoặc ở ghép',
      'Tìm kiếm trọ gần trường học',
      'Các tính năng khác'
    ]
  },
  {
    value: 'HOST',
    title: 'Chủ trọ',
    subtitle: 'Các tính năng nổi bật dành cho chủ trọ',
    icon: FaHome,
    features: [
      'Đăng tin cho thuê',
      'Quản lý yêu cầu thuê trọ',
      'Xây dựng hồ sơ chủ trọ uy tín',
      'Duyệt yêu cầu thuê',
      'Ưu tiên hiển thị bài đăng',
      'Các tính năng khác'
    ]
  }
]

const initialForm: OnboardingForm = {
  phone: '',
  dob: '',
  gender: '',
  universityId: ''
}

const genderOptions = [
  { value: '', label: 'Không chọn' },
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' }
]

const getBackendErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    return data?.error?.message || data?.message || 'Không thể hoàn tất thiết lập.'
  }

  return 'Không thể hoàn tất thiết lập.'
}

const getApplicationRole = (profile?: Pick<AuthenticatedUserProfile, 'roles'> | null): SetupRole | '' => {
  if (profile?.roles?.includes('STUDENT')) return 'STUDENT'
  if (profile?.roles?.includes('HOST')) return 'HOST'
  return ''
}

const OnboardingPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<SetupRole | ''>('')
  const [currentProfile, setCurrentProfile] = useState<AuthenticatedUserProfile | null>(null)
  const [form, setForm] = useState<OnboardingForm>(initialForm)
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const shouldLogoutOnLeaveRef = useRef(true)
  const isSetupCompleteRef = useRef(false)

  const selectedRole = useMemo(() => roleOptions.find((option) => option.value === role), [role])

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSetupCompleteRef.current) return

      event.preventDefault()
      event.returnValue = 'Bạn chưa hoàn tất thiết lập. Bạn có chắc chắn muốn rời đi?'
    }
    const handlePageHide = () => {
      if (shouldLogoutOnLeaveRef.current && !isSetupCompleteRef.current) clearAuthSession()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [isSetupComplete])

  const handleSelectRole = (nextRole: SetupRole) => {
    const existingRole = getApplicationRole(currentProfile)
    if (existingRole && currentProfile?.status !== 'SET_UP') {
      setRole(existingRole)
      return
    }

    setRole(nextRole)
    setFieldErrors({})
    setForm((current) => ({
      ...current,
      universityId: nextRole === 'STUDENT' ? current.universityId : ''
    }))
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, universityOptions] = await Promise.all([
          userService.getMyProfile(),
          locationService.getUniversities()
        ])

        setCurrentProfile(profile || null)
        setUniversities(universityOptions)
        const existingRole = getApplicationRole(profile)
        if (existingRole) {
          setRole(existingRole)
          setStep(2)
        }

        setForm({
          phone: profile?.phone || '',
          dob: profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '',
          gender: profile?.gender || '',
          universityId: profile?.student?.universityId || ''
        })
      } catch {
        setMessage('Không tải được dữ liệu thiết lập. Vui lòng đăng nhập lại.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const goToProfileStep = () => {
    if (!role) {
      setFieldErrors({ role: 'Vui lòng chọn Sinh viên hoặc Chủ trọ để tiếp tục.' })
      return
    }

    setFieldErrors({})
    setStep(2)
  }

  const validateStepTwo = () => {
    const nextErrors: FieldErrors = {}
    const phone = form.phone.trim()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dob = form.dob ? new Date(form.dob) : null

    if (!role) nextErrors.role = 'Vui lòng chọn vai trò.'
    if (!phone) {
      nextErrors.phone = 'Số điện thoại là bắt buộc.'
    } else if (!/^\d{10}$/.test(phone)) {
      nextErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.'
    }
    if (!form.dob) {
      nextErrors.dob = 'Ngày sinh là bắt buộc.'
    } else if (!dob || Number.isNaN(dob.getTime()) || dob >= today) {
      nextErrors.dob = 'Ngày sinh phải nhỏ hơn ngày hiện tại.'
    }
    if (role === 'STUDENT' && !form.universityId) {
      nextErrors.universityId = 'Vui lòng chọn trường đại học.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateStepTwo() || !role) return

    setSaving(true)
    setMessage('')

    try {
      const existingRole = getApplicationRole(currentProfile)
      const shouldUpdateExistingProfile = currentProfile?.status !== 'SET_UP' && Boolean(existingRole)

      const profilePayload = {
        phone: form.phone.trim(),
        dob: form.dob,
        gender: form.gender || undefined,
        universityId: role === 'STUDENT' ? form.universityId : undefined
      }

      const response = shouldUpdateExistingProfile
        ? await userService.updateProfile(profilePayload)
        : await userService.setupProfile({
            role,
            ...profilePayload
          })
      const profile = await userService.getMyProfile()

      if (profile) {
        setCurrentProfile(profile)
        localStorage.setItem(
          'authUser',
          JSON.stringify({
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            phone: profile.phone,
            avatarUrl: profile.avatarUrl,
            status: profile.status,
            roles: profile.roles
          })
        )
      } else if (response.data) {
        localStorage.setItem('authUser', JSON.stringify(response.data))
      }

      isSetupCompleteRef.current = true
      setIsSetupComplete(true)
      window.dispatchEvent(new Event('auth-user-updated'))
      shouldLogoutOnLeaveRef.current = false
      navigate('/home', { replace: true })
    } catch (error) {
      setMessage(getBackendErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#F5F7FA] text-[#181A20]'>
      <header className='border-b border-white/10 bg-[#001D3D] px-6 py-4 text-white'>
        <div className='mx-auto flex max-w-6xl items-center justify-between'>
          <div className='flex items-center gap-3'>
            <img src={logo} alt='UniStay' className='h-14 w-20 object-contain' />
            <div>
              <p className='text-xs font-extrabold uppercase tracking-[0.22em] text-[#FFC300]'>UniStay</p>
              <h1 className='text-lg font-black'>Thiết lập tài khoản bắt buộc</h1>
            </div>
          </div>
          <span className='rounded-full bg-white/10 px-4 py-2 text-xs font-bold'>Bước {step}/2</span>
        </div>
      </header>

      <main className='mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[320px_minmax(0,1fr)]'>
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className='rounded-2xl bg-white p-6 shadow-xl shadow-[#001D3D]/5'
        >
          <div className='grid gap-4'>
            {[
              ['1', 'Chọn vai trò', step === 1],
              ['2', 'Bổ sung thông tin', step === 2]
            ].map(([number, label, active]) => (
              <div
                key={String(number)}
                className={`flex justify-start gap-3 rounded-2xl px-4 py-4 ${
                  active ? 'bg-[#001D3D] text-white' : 'bg-[#F5F7FA] text-gray-500'
                }`}
              >
                <span className='grid h-9 w-9 place-items-center rounded-full bg-[#FFC300] text-sm font-black text-[#001D3D]'>
                  {number}
                </span>
                <span className='font-extrabold'>{label}</span>
              </div>
            ))}
          </div>
          <p className='mt-6 text-sm font-semibold leading-6 text-gray-500'>
            Bạn cần hoàn tất các thông tin này để UniStay cấp đúng quyền sử dụng và hiển thị liên hệ an toàn.
          </p>
        </motion.aside>

        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className='rounded-2xl bg-white p-6 shadow-xl shadow-[#001D3D]/5'
        >
          {message ? (
            <p className='mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600'>{message}</p>
          ) : null}

          {loading ? (
            <div className='grid min-h-[320px] place-items-center rounded-xl bg-gray-50'>
              <FaSpinner className='animate-spin text-4xl text-[#001D3D]' aria-label='Đang tải' />
            </div>
          ) : step === 1 ? (
            <div>
              <p className='text-sm font-extrabold uppercase tracking-[0.22em] text-[#FFC300]'>Bước 1</p>
              <h2 className='mt-2 text-3xl font-black'>Bạn sử dụng UniStay với vai trò nào?</h2>
              <p className='mt-2 text-sm font-semibold text-gray-500'>
                Vai trò sẽ cố định sau khi hoàn tất thiết lập để tránh sai quyền nghiệp vụ.
              </p>

              <div className='mt-7 grid gap-5 md:grid-cols-2'>
                {roleOptions.map((option) => {
                  const Icon = option.icon
                  const active = role === option.value

                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => handleSelectRole(option.value)}
                      className={`rounded-2xl border p-5 text-left transition ${
                        active
                          ? 'border-[#FFC300] bg-[#FFF7D6] shadow-lg shadow-[#FFC300]/20'
                          : 'border-gray-100 bg-white hover:border-[#FFC300]/70 hover:bg-[#FFFDF3]'
                      }`}
                    >
                      <span className='flex items-center justify-between gap-4'>
                        <span className='grid h-14 w-14 place-items-center rounded-2xl bg-[#001D3D] text-xl text-[#FFC300]'>
                          <Icon />
                        </span>
                        {active ? (
                          <span className='grid h-8 w-8 place-items-center rounded-full bg-green-500 text-white'>
                            <FaCheck />
                          </span>
                        ) : null}
                      </span>
                      <h3 className='mt-5 text-2xl font-black'>{option.title}</h3>
                      <p className='mt-2 text-sm font-semibold leading-6 text-gray-500'>{option.subtitle}</p>
                      <ul className='mt-5 grid gap-2 text-sm font-bold text-gray-700'>
                        {option.features.map((feature) => (
                          <li key={feature} className='flex items-start gap-2'>
                            <FaCheck className='mt-1 shrink-0 text-[#FFC300]' />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>

              {fieldErrors.role ? <p className='mt-4 text-sm font-bold text-red-600'>{fieldErrors.role}</p> : null}

              <div className='mt-7 flex justify-end'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type='button'
                  onClick={goToProfileStep}
                  className='rounded-full bg-[#001D3D] px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#003566]'
                >
                  Tiếp tục
                </motion.button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <p className='text-sm font-extrabold uppercase tracking-[0.22em] text-[#FFC300]'>Bước 2</p>
                  <h2 className='mt-2 text-3xl font-black'>Bổ sung thông tin còn thiếu</h2>
                  <p className='mt-2 text-sm font-semibold text-gray-500'>
                    Vai trò đã chọn: <span className='text-[#001D3D]'>{selectedRole?.title}</span>
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type='button'
                  onClick={() => {
                    setFieldErrors({})
                    setStep(1)
                  }}
                  title='Quay lại bước chọn vai trò'
                  className='inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2 text-sm font-extrabold text-gray-700 transition hover:bg-gray-200'
                >
                  <FaArrowLeft />
                </motion.button>
              </div>

              <div className='mt-7 grid gap-5 md:grid-cols-2'>
                <label className='grid gap-2 text-sm font-extrabold'>
                  <span className='inline-flex items-center gap-1'>
                    Số điện thoại <span className='text-red-500'>*</span>
                  </span>
                  <span className='relative'>
                    <FaPhoneAlt className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input
                      type='tel'
                      inputMode='numeric'
                      maxLength={10}
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phone: event.target.value.replace(/\D/g, '').slice(0, 10)
                        }))
                      }
                      className='w-full rounded-xl border border-gray-200 px-11 py-3 font-bold outline-none focus:border-[#FFC300]'
                      placeholder='Ví dụ: 0935009777'
                    />
                  </span>
                  {fieldErrors.phone ? (
                    <span className='text-xs font-bold text-red-600'>{fieldErrors.phone}</span>
                  ) : null}
                </label>

                <label className='grid gap-2 text-sm font-extrabold'>
                  <span className='inline-flex items-center gap-1'>
                    Ngày sinh <span className='text-red-500'>*</span>
                  </span>
                  <input
                    type='date'
                    value={form.dob}
                    onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                    className='w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300]'
                  />
                  {fieldErrors.dob ? <span className='text-xs font-bold text-red-600'>{fieldErrors.dob}</span> : null}
                </label>

                <label className='grid gap-2 text-sm font-extrabold'>
                  <span>Giới tính</span>
                  <select
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                    className='w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-[#FFC300]'
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {role === 'STUDENT' ? (
                  <label className='grid gap-2 text-sm font-extrabold'>
                    <span className='inline-flex items-center gap-1'>
                      Trường đại học <span className='text-red-500'>*</span>
                    </span>
                    <span className='relative'>
                      <FaUniversity className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                      <select
                        value={form.universityId}
                        onChange={(event) => setForm((current) => ({ ...current, universityId: event.target.value }))}
                        className='w-full rounded-xl border border-gray-200 px-11 py-3 font-bold outline-none focus:border-[#FFC300]'
                      >
                        <option value=''>Chọn trường đại học</option>
                        {universities.map((university) => (
                          <option key={university.id} value={university.id}>
                            {university.name}
                          </option>
                        ))}
                      </select>
                    </span>
                    {fieldErrors.universityId ? (
                      <span className='text-xs font-bold text-red-600'>{fieldErrors.universityId}</span>
                    ) : null}
                  </label>
                ) : null}
              </div>

              <div className='mt-8 flex justify-end'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type='submit'
                  disabled={saving}
                  className='rounded-full bg-[#001D3D] px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#003566] disabled:cursor-not-allowed disabled:bg-gray-300'
                >
                  {saving ? 'Đang hoàn tất...' : 'Hoàn tất thiết lập'}
                </motion.button>
              </div>
            </form>
          )}
        </motion.section>
      </main>
    </div>
  )
}

export default OnboardingPage
