'use client'

import { Container, Row, Col } from 'react-bootstrap';
import '../styles/footer.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <Container>
                <Row className="align-items-center">
                    <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
                        <div className="footer-brand">
                            <span className="footer-logo">🚌</span>
                            <span className="footer-title">QuanLyXeBuyt</span>
                        </div>
                        <p className="footer-description mt-2 mb-0">
                            Hệ thống quản lý xe buýt trường học thông minh
                        </p>
                    </Col>
                    <Col md={6} className="text-center text-md-end">
                        <div className="footer-links mb-2">
                            <a href="#" className="footer-link">Giới thiệu</a>
                            <a href="#" className="footer-link">Liên hệ</a>
                            <a href="#" className="footer-link">Hỗ trợ</a>
                            <a href="#" className="footer-link">Điều khoản</a>
                        </div>
                        <p className="footer-copyright mb-0">
                            © {currentYear} Smart School Bus. All rights reserved.
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}
