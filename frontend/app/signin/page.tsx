'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
      const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'oauth-demo';
      const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'nextjs-frontend';

      // Authenticate with Keycloak
      const response = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          username: formData.email,
          password: formData.password,
          grant_type: 'password',
        }),
      });

      if (!response.ok) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        return;
      }

      const data = await response.json();
      
      // Store tokens in sessionStorage
      sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('refresh_token', data.refresh_token);
      sessionStorage.setItem('user_email', formData.email);

      // Redirect to users list
      router.push('/users');
    } catch (err) {
      console.error('Sign in error:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">เข้าสู่ระบบ</h1>
        
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">อีเมล</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn">
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="link" onClick={() => router.push('/signup')}>
          ยังไม่มีบัญชี? สมัครสมาชิก
        </div>
      </div>
    </div>
  );
}
