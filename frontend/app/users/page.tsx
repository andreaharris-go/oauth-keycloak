'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
}

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    const accessToken = sessionStorage.getItem('access_token');
    const userEmail = sessionStorage.getItem('user_email');

    if (!accessToken) {
      router.push('/signin');
      return;
    }

    setCurrentUser(userEmail || '');
    fetchUsers(accessToken);
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please sign in again.');
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.clear();
    router.push('/signin');
  };

  const getCompanyBadgeClass = (company: string) => {
    switch (company.toLowerCase()) {
      case 'abc':
        return 'company-badge company-abc';
      case 'xyz':
        return 'company-badge company-xyz';
      case 'super':
        return 'company-badge company-super';
      default:
        return 'company-badge';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ textAlign: 'center' }}>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1 className="title" style={{ marginBottom: 0 }}>รายชื่อผู้ใช้</h1>
          <button onClick={handleSignOut} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            ออกจากระบบ
          </button>
        </div>

        {currentUser && (
          <div className="welcome">
            <p>ยินดีต้อนรับ, <strong>{currentUser}</strong></p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {users.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>ไม่พบผู้ใช้</p>
        ) : (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <div className="user-info">
                  <h3>{user.firstName} {user.lastName}</h3>
                  <p>{user.email}</p>
                </div>
                <span className={getCompanyBadgeClass(user.company)}>
                  {user.company.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
