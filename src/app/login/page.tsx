'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const roles = [
  {
    username: 'admin',
    title: 'Administrator',
    icon: '👑',
    color: '#0f1a3c',
    bg: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)',
    subtitle: 'Full Access',
  },
  {
    username: 'reception',
    title: 'Receptionist',
    icon: '🛎️',
    color: '#059669',
    bg: 'linear-gradient(135deg, #065f46, #059669)',
    subtitle: 'Guest Services',
  },
  {
    username: 'storekeeper',
    title: 'Storekeeper',
    icon: '📦',
    color: '#d97706',
    bg: 'linear-gradient(135deg, #92400e, #d97706)',
    subtitle: 'Inventory',
  },
  {
    username: 'security',
    title: 'Security',
    icon: '🛡️',
    color: '#dc2626',
    bg: 'linear-gradient(135deg, #991b1b, #dc2626)',
    subtitle: 'Access Control',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  async function handleLogin(username: string, password: string) {
    setError('');
    setLoading(username);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(null);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
      setLoading(null);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-5 py-8"
      style={{
        background: 'linear-gradient(135deg, #080e22 0%, #0f1a3c 40%, #1a2d5a 100%)',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div className="text-center mb-8">
        <Image
          src="/don suits.jpeg"
          alt="Don Suites"
          width={90}
          height={90}
          className="rounded-full mx-auto mb-3 border-2"
          style={{ borderColor: 'rgba(201,169,110,0.4)', objectFit: 'cover' }}
          priority
        />
        <h1 className="text-[26px] font-extrabold text-white mb-0.5">
          DON <span style={{ color: '#c9a96e' }}>SUITES</span>
        </h1>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          & Vacation Apartments
        </p>
        <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span>📍 Ntungamo, Kyamate Hill</span>
          <span className="mx-1">|</span>
          <span>📞 +256 741 44 5555</span>
          <span className="mx-1">|</span>
          <span>✉️ donsuites26@gmail.com</span>
        </p>
      </div>

      {error && (
        <div
          className="text-center text-sm mb-6 px-4 py-3 rounded-xl max-w-[900px] w-full"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[900px] w-full">
        {roles.map((role) => (
          <LoginForm
            key={role.username}
            role={role}
            onSubmit={handleLogin}
            isLoading={loading === role.username}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <a
          href="/guest/booking"
          className="text-sm font-medium no-underline transition-opacity hover:opacity-100"
          style={{ color: '#c9a96e', opacity: 0.7 }}
        >
          🛏️ Book a Room (Guest)
        </a>
      </div>
    </div>
  );
}

function LoginForm({
  role,
  onSubmit,
  isLoading,
}: {
  role: (typeof roles)[number];
  onSubmit: (username: string, password: string) => void;
  isLoading: boolean;
}) {
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(role.username, password);
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
        <div className="text-center text-white pt-6 pb-5 px-4" style={{ background: role.bg }}>
          <div className="text-[36px] mb-2.5">{role.icon}</div>
          <h3 className="text-[15px] font-bold mb-0.5">{role.title}</h3>
          <small className="text-[11px] opacity-80">{role.subtitle}</small>
        </div>
        <div className="text-center px-4 pb-6 pt-5">
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs mb-3"
            style={{ background: '#f1f5f9', color: '#475569' }}
          >
            <span className="text-[11px]" style={{ color: '#94a3b8' }}>👤</span>
            <span className="font-mono font-semibold">{role.username}</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full py-2.5 px-3.5 text-[13px] text-center rounded-lg outline-none transition-colors mb-2"
            style={{
              border: '2px solid #e2e8f0',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#c9a96e')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-[10px] text-white font-semibold text-[13px] cursor-pointer transition-all duration-200 mt-2 disabled:opacity-60"
            style={{ background: role.color }}
          >
            {isLoading ? 'Signing in...' : '🔐 Login'}
          </button>
        </div>
      </div>
    </form>
  );
}
