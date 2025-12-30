'use client';

import { useBackendAuth } from '@/lib/use-backend-auth';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const { user, logout } = useBackendAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav style={{
      padding: '15px 20px',
      backgroundColor: '#0070f3',
      color: 'white',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h2 style={{ margin: 0 }}>Todo App</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user && (
          <span style={{ fontSize: '14px' }}>
            {user.email}
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#0070f3',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
