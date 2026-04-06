import { Link } from 'react-router-dom';
import LogoMark from './LogoMark';

export default function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <nav className="public-nav">
        <Link to="/" className="public-nav-brand">
          <LogoMark />
          <span>ForgeMode</span>
        </Link>
        <div className="public-nav-links">
          <Link to="/pricing">Pricing</Link>
          <Link to="/login">Log in</Link>
          <Link to="/register" className="btn btn-accent btn-sm">Get Started</Link>
        </div>
      </nav>
      <main className="public-main">{children}</main>
      <footer className="public-footer">
        <div className="public-footer-inner">
          <p>&copy; {new Date().getFullYear()} ForgeMode. All rights reserved.</p>
          <div className="public-footer-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
