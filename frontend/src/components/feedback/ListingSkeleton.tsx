export const ListingSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className='block overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white shadow-lg shadow-[#001D3D]/5 animate-pulse'
        >
          {/* Card Image Placeholder */}
          <div className='relative h-48 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200'>
            <div className='absolute left-4 top-4 h-6 w-20 rounded-full bg-gray-300/80' />
            <div className='absolute right-4 top-4 h-10 w-10 rounded-full bg-white/70' />
          </div>

          {/* Card Content */}
          <div className='p-5'>
            {/* Title (2 lines) */}
            <div className='min-h-[56px] space-y-2'>
              <div className='h-5 w-5/6 rounded-md bg-gray-200' />
              <div className='h-5 w-3/5 rounded-md bg-gray-200' />
            </div>

            {/* Location */}
            <div className='mt-3 flex items-center gap-2'>
              <div className='h-4 w-4 rounded-full bg-gray-200' />
              <div className='h-4 w-1/2 rounded-md bg-gray-200' />
            </div>

            {/* Price & Rating */}
            <div className='mt-5 flex items-center justify-between'>
              <div className='h-6 w-32 rounded-md bg-gray-200' />
              <div className='h-5 w-12 rounded-md bg-gray-200' />
            </div>

            {/* Meta Tags */}
            <div className='mt-4 flex flex-wrap gap-2'>
              <div className='h-6 w-14 rounded-full bg-gray-100' />
              <div className='h-6 w-16 rounded-full bg-gray-100' />
              <div className='h-6 w-14 rounded-full bg-gray-100' />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export const AreaSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className='block rounded-2xl border border-[#E6EAF0] bg-white p-6 shadow-lg shadow-[#001D3D]/5 animate-pulse'
        >
          <div className='h-1.5 w-16 rounded-full bg-gray-200' />
          <div className='mt-8 h-7 w-28 rounded-md bg-gray-200' />
          <div className='mt-3 h-4 w-44 rounded-md bg-gray-100' />
        </div>
      ))}
    </>
  )
}
