// app/bookshelf/book/[isbn]/loading.tsx

const Loading = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md animate-pulse">
          {/* BookCard Skeleton */}
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
            <div className="w-32 h-48 relative mb-4 bg-gray-200 rounded"></div>
            <div className="text-center">
              <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
  
          {/* ScanResult Skeleton */}
          <div className="mt-4">
            <div className="w-full max-w-md p-4">
              <div className="h-5 bg-gray-300 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
  
          {/* ActionButton Skeleton */}
          <div className="mt-8 w-full h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  };
  
  export default Loading;
  