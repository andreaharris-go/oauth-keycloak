'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.company) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    try {
      // Get Keycloak admin token
      const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
      const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'oauth-demo';

      // For demo purposes, we'll use direct API calls to Keycloak
      // In production, this should be done through a backend service
      const adminToken = await getAdminToken(keycloakUrl);

      // Create user in Keycloak
      const createUserResponse = await fetch(`${keycloakUrl}/admin/realms/${realm}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          enabled: true,
          emailVerified: true,
          attributes: {
            company: [formData.company],
          },
          credentials: [
            {
              type: 'password',
              value: formData.password,
              temporary: false,
            },
          ],
        }),
      });

      if (createUserResponse.ok || createUserResponse.status === 201) {
        setSuccess('ลงทะเบียนสำเร็จ! กำลังนำคุณไปยังหน้า Sign In...');
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        const errorData = await createUserResponse.text();
        console.error('Error creating user:', errorData);
        setError('ไม่สามารถลงทะเบียนได้ อีเมลนี้อาจถูกใช้งานแล้ว');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('เกิดข้อผิดพลาดในการลงทะเบียน โปรดลองใหม่อีกครั้ง');
    }
  };

  const getAdminToken = async (keycloakUrl: string) => {
    const response = await fetch(`${keycloakUrl}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin',
        grant_type: 'password',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get admin token');
    }

    const data = await response.json();
    return data.access_token;
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">สมัครสมาชิก</h1>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

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
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="firstName">ชื่อ</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="ชื่อของคุณ"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">นามสกุล</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="นามสกุลของคุณ"
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">บริษัท</label>
            <select
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            >
              <option value="">เลือกบริษัท</option>
              <option value="abc">ABC</option>
              <option value="xyz">XYZ</option>
            </select>
          </div>

          <button type="submit" className="btn">
            สมัครสมาชิก
          </button>
        </form>

        <div className="link" onClick={() => router.push('/signin')}>
          มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
        </div>
      </div>
    </div>
  );
}
