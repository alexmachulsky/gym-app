import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import armsImage from '../assets/photos/arms.jpg';
import backImage from '../assets/photos/back.jpg';
import cardioImage from '../assets/photos/cardio.jpg';
import chestImage from '../assets/photos/chest.jpg';
import coreImage from '../assets/photos/core.jpg';
import fullbodyImage from '../assets/photos/fullbody.jpg';
import legsImage from '../assets/photos/legs.jpg';
import mobilityImage from '../assets/photos/mobility.jpg';
import olympicImage from '../assets/photos/olympic.jpg';
import shouldersImage from '../assets/photos/shoulders.jpg';
import LogoMark from './LogoMark';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('access_token');
    navigate('/login', { replace: true });
  };

  const pageViewByPath = {
    '/workouts': {
      title: 'Workout Command Center',
      subtitle: 'Log sessions, manage sets, and keep your training workload crystal clear.',
      image: cardioImage,
      imageAlt: 'Athlete in cardio training mode',
      sideLeftImage: legsImage,
      sideRightImage: fullbodyImage,
    },
    '/exercises': {
      title: 'Exercise Library and Templates',
      subtitle: 'Browse popular movements and add the exact exercises your plan needs.',
      image: chestImage,
      imageAlt: 'Exercise template category visual',
      sideLeftImage: backImage,
      sideRightImage: shouldersImage,
    },
    '/body-metrics': {
      title: 'Body Metrics Timeline',
      subtitle: 'Track body-weight trends and pair them with your performance progress.',
      image: armsImage,
      imageAlt: 'Body metrics and physique tracking visual',
      sideLeftImage: mobilityImage,
      sideRightImage: coreImage,
    },
    '/progress': {
      title: 'Strength Intelligence',
      subtitle: 'Analyze plateau signals and progression patterns with confidence.',
      image: olympicImage,
      imageAlt: 'Strength progression and olympic lifting visual',
      sideLeftImage: chestImage,
      sideRightImage: olympicImage,
    },
  };

  const pageView = pageViewByPath[location.pathname] || {
    title: 'Smart Gym Progress Tracker',
    subtitle: 'Track performance with structure, precision, and progression-focused insights.',
    image: cardioImage,
    imageAlt: 'Gym hero visual',
    sideLeftImage: legsImage,
    sideRightImage: fullbodyImage,
  };

  return (
    <div className="app-stage">
      <aside className="side-visual side-visual-left" key={`${location.pathname}-left`} aria-hidden="true">
        <img src={pageView.sideLeftImage} alt="" loading="eager" />
      </aside>

      <div className="layout-shell">
        <header className="topbar">
          <LogoMark />
          <nav className="main-nav">
            <NavLink to="/workouts">Workouts</NavLink>
            <NavLink to="/exercises">Exercises</NavLink>
            <NavLink to="/body-metrics">Body Metrics</NavLink>
            <NavLink to="/progress">Progress</NavLink>
            <button type="button" className="ghost-btn" onClick={logout}>Logout</button>
          </nav>
        </header>

        <section className="page-banner">
          <div className="page-banner-copy">
            <h1>{pageView.title}</h1>
            <p>{pageView.subtitle}</p>
          </div>
          <figure className="page-banner-visual" key={location.pathname}>
            <img src={pageView.image} alt={pageView.imageAlt} loading="eager" />
          </figure>
        </section>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <aside className="side-visual side-visual-right" key={`${location.pathname}-right`} aria-hidden="true">
        <img src={pageView.sideRightImage} alt="" loading="eager" />
      </aside>
    </div>
  );
}
