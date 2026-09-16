'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md w-full">
        <i
          className="fas fa-exclamation-triangle text-4xl mb-3 block"
          style={{ color: '#ef4444', opacity: 0.3 }}
        ></i>
        <h5 className="text-gray-400 font-medium mb-3">Something went wrong</h5>
        <p className="text-xs text-gray-400 mb-4">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#0f1a3c' }}
        >
          <i className="fas fa-redo"></i> Try Again
        </button>
      </div>
    </div>
  );
}
