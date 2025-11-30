'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.username || !formData.password) {
            setError('Vui lòng điền đầy đủ thông tin');
            setLoading(false);
            return;
        }

        try {
            // Gọi API backend để đăng nhập
            const response = await authAPI.login(formData.username, formData.password);

            // Đồng bộ lưu thông tin đăng nhập vào localStorage (nếu chưa được lưu trong authAPI.login)
            if (response.token) {
                localStorage.setItem('token', response.token);
            }
            if (response.access_token) {
                localStorage.setItem('token', response.access_token);
            }
            if (response.user && response.user.role) {
                localStorage.setItem('userRole', response.user.role);
            }
            if (response.user && response.user.full_name) {
                localStorage.setItem('userName', response.user.full_name);
            }
            if (response.user && response.user.id) {
                localStorage.setItem('userId', response.user.id);
            }


            // Phát custom event 'authChanged' để header cập nhật ngay lập tức
            window.dispatchEvent(new Event('authChanged'));

            // Chuyển hướng tùy theo role bằng router.push
            const role = (response.user?.role || '').toLowerCase();
            if (role === 'admin') {
                router.push('/admin');
            } else if (role === 'driver') {
                router.push('/driver');
            } else if (role === 'parent') {
                router.push('/parent');
            } else {
                router.push('/');
            }
        } catch (err) {
            setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Container>
                <Row className="justify-content-center align-items-center min-vh-100">
                    <Col md={6} lg={5}>


                        <Card className="auth-card shadow">
                            <Card.Body className="p-4">
                                <h3 className="text-center mb-4">Đăng nhập</h3>


                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tên đăng nhập</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            placeholder="Nhập tên đăng nhập"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Mật khẩu</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            placeholder="Nhập mật khẩu"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </Form.Group>



                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-100 mb-3"
                                        disabled={loading}
                                    >
                                        Đăng nhập
                                    </Button>
                                </Form>


                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
