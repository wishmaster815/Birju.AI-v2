// MainContent loading skeleton that works for both roadmap and counseling views
const MainContentSkeleton = () => (
  <div className="w-full max-w-6xl mx-auto py-6 px-4 md:px-10">
    <div className="animate-pulse space-y-12">
      {/* Main header skeleton */}
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
      
      {/* Introduction section skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-5 bg-gray-200 rounded w-full"></div>
        <div className="h-5 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Career pathways skeleton */}
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="w-full bg-white rounded-2xl p-6 shadow-md border border-gray-200">
            {/* Role header */}
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            
            {/* Description */}
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5 mb-4"></div>
            
            {/* Key Responsibilities */}
            <div className="my-5 px-5">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            
            {/* Learning Resources */}
            <div className="my-5 px-5">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
            
            {/* Additional info */}
            <div className="flex flex-col gap-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
        
        {/* Recommendation and Situational Overview skeletons */}
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="w-full bg-white rounded-2xl p-6 shadow-md border border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MainContentSkeleton;