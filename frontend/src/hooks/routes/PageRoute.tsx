import { useEffect, useState, type ReactNode } from 'react'

import { FaSpinner } from 'react-icons/fa'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import {
  AdminOverviewPage,
  AdminReportsPage,
  AdminHostsPage,
  AdminPostsPage,
  AdminUsersPage,
  BlockedUsersPage,
  ChangePasswordPage,
  ContactRequestsPage,
  CreatePostPage,
  DemandPage,
  FavouritePostsPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  MyPostsPage,
  NearbyPostsPage,
  OnboardingPage,
  PostDetailPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  SearchResultsPage,
  UserDetailPage,
  VerifyEmailPage
} from '@/pages/index.tsx'
import userService, { type AuthenticatedUserProfile } from '@/services/userService'
import { clearAuthSession } from '@/utils/authSession'

const ONBOARDING_PATH = '/onboarding'

const isOnboardingRequired = (profile?: Pick<AuthenticatedUserProfile, 'phone' | 'roles' | 'status'> | null) => {
  if (!profile) return false

  const roles = profile.roles || []
  const isAdmin = roles.includes('ADMIN')
  const hasApplicationRole = roles.includes('STUDENT') || roles.includes('HOST') || isAdmin

  return profile.status === 'SET_UP' || !hasApplicationRole || (!isAdmin && !profile.phone?.trim())
}

const getStoredProfile = () => {
  try {
    const rawUser = localStorage.getItem('authUser')
    return rawUser ? (JSON.parse(rawUser) as Pick<AuthenticatedUserProfile, 'phone' | 'roles' | 'status'>) : null
  } catch {
    return null
  }
}

const persistProfile = (profile: AuthenticatedUserProfile) => {
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
  window.dispatchEvent(new Event('auth-user-updated'))
}

const MandatoryOnboardingGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem('accessToken') && !getStoredProfile()))
  const [requiresOnboarding, setRequiresOnboarding] = useState(() => isOnboardingRequired(getStoredProfile()))
  const [handlingExit, setHandlingExit] = useState(false)
  const isOnboardingRoute = location.pathname === ONBOARDING_PATH

  useEffect(() => {
    const syncOnboardingState = () => {
      setRequiresOnboarding(isOnboardingRequired(getStoredProfile()))
    }

    window.addEventListener('auth-user-updated', syncOnboardingState)

    return () => {
      window.removeEventListener('auth-user-updated', syncOnboardingState)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const storedProfile = getStoredProfile()

    if (!token) {
      setRequiresOnboarding(false)
      setChecking(false)
      return
    }

    let isMounted = true

    setChecking(!storedProfile)
    userService
      .getMyProfile()
      .then((profile) => {
        if (!isMounted) return

        if (profile) {
          persistProfile(profile)
          setRequiresOnboarding(isOnboardingRequired(profile))
        } else {
          setRequiresOnboarding(isOnboardingRequired(getStoredProfile()))
        }
      })
      .catch(() => {
        if (isMounted) setRequiresOnboarding(isOnboardingRequired(getStoredProfile()))
      })
      .finally(() => {
        if (isMounted) setChecking(false)
      })

    return () => {
      isMounted = false
    }
  }, [location.pathname])

  useEffect(() => {
    if (!requiresOnboarding || isOnboardingRoute || handlingExit) return

    const latestRequiresOnboarding = isOnboardingRequired(getStoredProfile())

    if (!latestRequiresOnboarding) {
      setRequiresOnboarding(false)
      return
    }

    setHandlingExit(true)
    const shouldLeaveIncompleteSetup = window.confirm('Bạn chưa hoàn tất thiết lập. Bạn có chắc chắn muốn rời đi?')

    if (shouldLeaveIncompleteSetup) {
      clearAuthSession()
      setRequiresOnboarding(false)
      navigate('/login', { replace: true })
    } else {
      navigate(ONBOARDING_PATH, { replace: true })
    }

    setHandlingExit(false)
    return
  }, [handlingExit, isOnboardingRoute, navigate, requiresOnboarding])

  if (checking) {
    return (
      <div className='grid min-h-screen place-items-center bg-[#F5F7FA] px-6 text-center'>
        <div className='grid h-20 w-20 place-items-center rounded-2xl bg-white text-[#001D3D] shadow-lg shadow-[#001D3D]/5'>
          <FaSpinner className='animate-spin text-3xl' aria-label='Đang tải' />
        </div>
      </div>
    )
  }

  if (requiresOnboarding && !isOnboardingRoute) {
    return (
      <div className='grid min-h-screen place-items-center bg-[#F5F7FA] px-6 text-center'>
        <div className='grid h-20 w-20 place-items-center rounded-2xl bg-white text-[#001D3D] shadow-lg shadow-[#001D3D]/5'>
          <FaSpinner className='animate-spin text-3xl' aria-label='Đang tải' />
        </div>
      </div>
    )
  }

  if (!requiresOnboarding && isOnboardingRoute) {
    return <Navigate to='/home' replace />
  }

  return children
}

const AppRoutes = () => {
  return (
    <MandatoryOnboardingGuard>
      <Routes>
        <Route path='/' element={<Navigate to='/home' replace />} />
        <Route path='/login' element={<LoginPage />}></Route>
        <Route path='/onboarding' element={<OnboardingPage />}></Route>
        <Route path='/forgot-password' element={<ForgotPasswordPage />}></Route>
        <Route path='/reset-password' element={<ResetPasswordPage />}></Route>
        <Route path='/home' element={<HomePage />}></Route>
        <Route path='/post' element={<Navigate to='/posts/search' replace />} />
        <Route path='/posts' element={<Navigate to='/posts/search' replace />} />
        <Route path='/posts/create' element={<CreatePostPage />}></Route>
        <Route path='/posts/favourites' element={<FavouritePostsPage />}></Route>
        <Route path='/posts/me' element={<MyPostsPage />}></Route>
        <Route path='/contacts' element={<ContactRequestsPage />}></Route>
        <Route path='/posts/search' element={<SearchResultsPage />}></Route>
        <Route path='/posts/nearby' element={<NearbyPostsPage />}></Route>
        <Route path='/posts/:postId' element={<PostDetailPage />}></Route>
        <Route path='/users/:id' element={<UserDetailPage />}></Route>
        <Route path='/account/profile' element={<ProfilePage />}></Route>
        <Route path='/account/password' element={<ChangePasswordPage />}></Route>
        <Route path='/account/blocked-users' element={<BlockedUsersPage />}></Route>
        <Route path='/demands' element={<DemandPage />}></Route>
        <Route path='/admin' element={<Navigate to='/admin/overview' replace />} />
        <Route path='/admin/overview' element={<AdminOverviewPage />}></Route>
        <Route path='/admin/posts' element={<AdminPostsPage />}></Route>
        <Route path='/admin/users' element={<AdminUsersPage />}></Route>
        <Route path='/admin/reports' element={<AdminReportsPage />}></Route>
        <Route path='/admin/hosts' element={<AdminHostsPage />}></Route>
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-email' element={<VerifyEmailPage />} />
        <Route path='*' element={<Navigate to='/home' replace />} />
      </Routes>
    </MandatoryOnboardingGuard>
  )
}

export default AppRoutes
