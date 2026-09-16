'use client';

import Image from 'next/image';

export default function LoginError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background: 'linear-gradient(135deg, #080e22 0%, #0f1a3c 40%, #1a2d5a 100%)',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Image
        src="/don suits.jpeg"
        alt="Don Suites"
        width={80}
        height={80}
        className="rounded-full mx-auto mb-4 border-2"
        style={{ borderColor: 'rgba(201,169,110,0.4)', objectFit: 'cover' }}
        priority
      />
      <h1 className="text-2xl font-extrabold text-white mb-1">
        DON <span style={{ color: '#c9a96e' }}>SUITES</span>
      </h1>
      <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md w-full">
        <i
          className="fas fa-exclamation-triangle text-4xl mb-3 block"
          style={{ color: '#ef4444', opacity: 0.6 }}
        ></i>
        <h2 className="text-lg font-bold text-white mb-2">Login Error</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {error.message || 'Failed to load login page'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: '#c9a96e', color: '#080e22' }}
        >
          <i className="fas fa-redo"></i> Try Again
        </button>
      </div>
    </div>
  );
}
