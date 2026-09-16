import Image from 'next/image';

export default function RootLoading() {
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
      <h1 className="text-2xl font-extrabold text-white mb-4">
        DON <span style={{ color: '#c9a96e' }}>SUITES</span>
      </h1>
      <i
        className="fas fa-spinner fa-spin text-3xl"
        style={{ color: '#c9a96e' }}
      ></i>
      <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Loading...
      </p>
    </div>
  );
}
