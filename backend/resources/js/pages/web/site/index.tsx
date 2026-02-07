
import { ArrowRight, CheckCircle, Clock, Gem, Play, Search, Star, Zap } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => (
  <nav className="navbar">
    <div className="container nav-content">
      <div className="logo">
        <span className="logo-icon">T</span>
        <span className="logo-text">theme<span>wagon</span></span>
      </div>
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search themes..." />
      </div>
      <div className="nav-links">
        <a href="#">Browse Themes</a>
        <a href="#" className="flex-center"><Zap size={14} fill="#f5a623" color="#f5a623" /> Premium</a>
        <a href="#">Freebies</a>
        <a href="#">Sign in</a>
        <a href="#" className="btn-signup">Sign up</a>
        <button className="btn btn-primary">Hire us</button>
      </div>
    </div>
  </nav>
);

const SubNavbar = () => (
  <div className="sub-navbar">
    <div className="container sub-nav-content">
      <div className="categories-scroll">
        <a href="#" className="active">Admin & Dashboard</a>
        <a href="#">Bootstrap 5</a>
        <a href="#">Material UI</a>
        <a href="#">Tailwind CSS</a>
        <a href="#">eCommerce</a>
        <a href="#">Landing Pages</a>
        <a href="#">Business & Corporate</a>
        <a href="#">Portfolio</a>
        <a href="#">Educational</a>
      </div>
      <div className="promo-tag">
        Bundle - Save 88%
      </div>
    </div>
  </div>
);

const Hero = () => (
  <header className="hero">
    <div className="container hero-content">
      <div className="hero-left">
        <div className="illustration-wrapper">
          <div className="blob-bg"></div>
          <img src="https://via.placeholder.com/500x400/f8f9fa/333?text=Modern+UI+Illustration" alt="Hero Illustration" />
        </div>
      </div>
      <div className="hero-right">
        <h1>Build Better UI, <span>Faster</span></h1>
        <p>The #1 Collection of Free and Premium Web Templates</p>
      </div>
    </div>
  </header>
);

const Tabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
  <section className="tabs-section">
    <div className="container">
      <div className="tabs-container">
        <div
          className={`tab-item ${activeTab === 'premium' ? 'active' : ''}`}
          onClick={() => setActiveTab('premium')}
        >
          <div className="tab-icon-wrapper">
            <CheckCircle size={24} color="#28a745" />
          </div>
          <div className="tab-text">
            <h3>Premium Templates</h3>
            <p>Better UX. Clean Code. Technical Support</p>
          </div>
        </div>
        <div
          className={`tab-item ${activeTab === 'freebies' ? 'active' : ''}`}
          onClick={() => setActiveTab('freebies')}
        >
          <div className="tab-icon-wrapper">
            <Gem size={24} color="#6c757d" />
          </div>
          <div className="tab-text">
            <h3>Top Freebies</h3>
            <p>The most downloaded free templates</p>
          </div>
        </div>
        <div
          className={`tab-item ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <div className="tab-icon-wrapper">
            <Clock size={24} color="#6c757d" />
          </div>
          <div className="tab-text">
            <h3>Recent Releases</h3>
            <p>Freshly baked. Latest trending UI</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const TemplateCard = ({ image, title, price, isFree }: { image: string, title: string, price: number, isFree?: boolean }) => (
  <div className="template-card">
    <div className="card-image">
      <img src={image} alt={title} />
      <div className="card-overlay">
        <button className="btn-live">Live Demo</button>
      </div>
    </div>
    <div className="card-info">
      <h4>{title}</h4>
      <div className="card-meta">
        <span className={`price ${isFree ? 'free' : ''}`}>{isFree ? 'Free' : `$${price}`}</span>
        <div className="rating">
          <Star size={12} fill="#f5a623" color="#f5a623" />
          <Star size={12} fill="#f5a623" color="#f5a623" />
          <Star size={12} fill="#f5a623" color="#f5a623" />
          <Star size={12} fill="#f5a623" color="#f5a623" />
          <Star size={12} fill="#f5a623" color="#f5a623" />
        </div>
      </div>
    </div>
  </div>
);

const ThemeWagonPage = () => {
  const [activeTab, setActiveTab] = useState('premium');

  const templates = [
    { id: 1, title: 'Phoenix - Premium Bootstrap 5 Admin Dashboard', image: 'https://via.placeholder.com/400x250/333/fff?text=Phoenix', price: 59 },
    { id: 2, title: 'Falcon - Premium Bootstrap 5 Dashboard', image: 'https://via.placeholder.com/400x250/222/eee?text=Falcon', price: 69 },
    { id: 3, title: 'Sparrow - Creative Multipurpose Template', image: 'https://via.placeholder.com/400x250/444/ddd?text=Sparrow', price: 49 },
    { id: 4, title: 'Gulp - Multipage Landing Page Portfolio', image: 'https://via.placeholder.com/400x250/555/ccc?text=Gulp', price: 39 },
    { id: 5, title: 'Basic - Simple Free Blog Template', image: 'https://via.placeholder.com/400x250/666/bbb?text=Basic', price: 0, isFree: true },
    { id: 6, title: 'E-commerce Theme - Dark Mode Support', image: 'https://via.placeholder.com/400x250/777/aaa?text=E-commerce', price: 79 },
  ];

  return (
    <div className="tw-clone">
      <Navbar />
      <SubNavbar />
      <main>
        <Hero />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <section className="grid-section container">
          <div className="template-grid">
            {templates.map(t => (
              <TemplateCard key={t.id} {...t} />
            ))}
          </div>
          <div className="view-all">
            <button className="btn btn-outline">View All Templates <ArrowRight size={16} /></button>
          </div>
        </section>

        <section className="hire-section container">
            <div className="hire-card">
            <div className="hire-content">
                <h2>Hire top notch React & UI/UX specialists from ThemeWagon</h2>
                <p>Need help with custom development? We can help you with software engineers experienced in Backend and front-end development.</p>
                <div className="hire-cta">
                <button className="btn btn-primary">Get a Free Quote</button>
                <div className="email-link">Email: reza@themewagon.com</div>
                </div>
            </div>
            <div className="hire-video">
                <div className="video-placeholder">
                <Play size={40} fill="#fff" />
                <span>Watch Video</span>
                </div>
            </div>
            </div>
        </section>

        <section className="newsletter">
          <div className="container">
            <div className="newsletter-card">
              <h3>Get new themes and discounts in your inbox!</h3>
              <p>New themes or big discounts. Never spam.</p>
              <form className="newsletter-form">
                <input type="email" placeholder="Email address" />
                <button className="btn btn-secondary" type="submit">Subscribe</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-links">
            <a href="#">Blog</a>
            <a href="#">About</a>
            <a href="#">Terms</a>
            <a href="#">License</a>
            <a href="#">Contact</a>
            <a href="#">Support</a>
            <a href="#">Submit Free Template</a>
          </div>
          <div className="footer-bottom">
            <div className="social-links">
              {/* Icons here */}
            </div>
            <div className="copyright">
              ThemeWagon Inc © 2026
            </div>
            <div className="redownload">
               Redownload a theme
            </div>
          </div>
        </div>
      </footer>

      <div className="support-badge">
        <Play size={16} fill="#fff" /> Support
      </div>
    </div>
  );
};

export default ThemeWagonPage;
