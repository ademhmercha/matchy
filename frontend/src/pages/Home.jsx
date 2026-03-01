import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Home.css';

const Home = () => {
    const { t } = useTranslation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 50;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        document.addEventListener('scroll', handleScroll);
        return () => document.removeEventListener('scroll', handleScroll);
    }, [scrolled]);

    return (
        <div className="home-container">
            <section className="hero-section flex items-center justify-center">
                <div className="hero-overlay"></div>
                <div className="hero-content text-center container">
                    <h1 className="hero-title">{t('home.heroTitle')}</h1>
                    <p className="hero-subtitle">{t('auth.readyForMatches')}</p>
                    <Link to="/register" className="btn-primary hero-btn">{t('auth.createAccount')}</Link>
                </div>
            </section>

            <section className="stories-section">
                <div className="container">
                    <h2 className="section-title">{t('home.storiesTitle')}</h2>
                    <div className="stories-grid">
                        <div className="story-card">
                            <div className="story-image bg-pink"></div>
                            <div className="story-content">
                                <h3>{t('home.story1Title')}</h3>
                                <p>{t('home.story1Content')}</p>
                            </div>
                        </div>

                        <div className="story-card">
                            <div className="story-image bg-blue"></div>
                            <div className="story-content">
                                <h3>{t('home.story2Title')}</h3>
                                <p>{t('home.story2Content')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footer-section">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <h4>{t('common.appName')}</h4>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
