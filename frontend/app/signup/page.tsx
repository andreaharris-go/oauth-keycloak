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
      const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
      const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'oauth-demo';

      // Register user via Keycloak's registration endpoint
      // This uses the self-registration feature which is more secure than using admin API
      const registrationUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/registrations`;
      
      const response = await fetch(registrationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          attributes: {
            company: [formData.company],
          },
        }),
      });

      // Since Keycloak registration endpoint requires a different approach,
      // we'll use the backend API for user registration instead
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const createUserResponse = await fetch(`${apiUrl}/api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
        }),
      });

      if (createUserResponse.ok) {
        setSuccess('ลงทะเบียนสำเร็จ! กำลังนำคุณไปยังหน้า Sign In...');
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        const errorData = await createUserResponse.json();
        setError(errorData.message || 'ไม่สามารถลงทะเบียนได้ อีเมลนี้อาจถูกใช้งานแล้ว');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('เกิดข้อผิดพลาดในการลงทะเบียน โปรดลองใหม่อีกครั้ง');
    }
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
