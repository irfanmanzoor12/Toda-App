'use client';

import Link from 'next/link';

export default function ChatButton() {
  return (
    <Link
      href="/chat"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#0070f3',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        textDecoration: 'none',
        boxShadow: '0 4px 12px rgba(0, 112, 243, 0.4)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        zIndex: 1000,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 112, 243, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 112, 243, 0.4)';
      }}
      title="AI Todo Assistant"
    >
      💬
    </Link>
  );
}
