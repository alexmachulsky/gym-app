import { useEffect, useMemo, useState } from 'react';
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
import api from '../api/client';
import LogoMark from './LogoMark';
import OnboardingWizard from './OnboardingWizard';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await api.get('/auth/me');
        if (active) {
          setUserEmail(response.data.email || '');
          setIsAdmin(response.data.is_admin || false);
          if (!response.data.onboarding_completed) {
            setShowOnboarding(true);
          }
        }
      } catch {
        if (active) {
          setUserEmail('');
          setIsAdmin(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  const userLabel = useMemo(() => {
    if (!userEmail) return 'Athlete';
    const username = userEmail.split('@')[0]?.trim();
    return username || userEmail;
  }, [userEmail]);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
      subtitle: 'Analyze plateau signals, track PRs, and monitor muscle group balance.',
      image: olympicImage,
      imageAlt: 'Strength progression and olympic lifting visual',
      sideLeftImage: chestImage,
      sideRightImage: olympicImage,
    },
    '/templates': {
      title: 'Workout Templates',
      subtitle: 'Save your favourite routines and start sessions with a single tap.',
      image: fullbodyImage,
      imageAlt: 'Workout template planning visual',
      sideLeftImage: cardioImage,
      sideRightImage: backImage,
    },
    '/goals': {
      title: 'Goals & Streaks',
      subtitle: 'Set training targets and maintain momentum with streak tracking.',
      image: legsImage,
      imageAlt: 'Goal setting and streak tracking visual',
      sideLeftImage: shouldersImage,
      sideRightImage: armsImage,
    },
    '/ai-coach': {
      title: 'AI Training Coach',
      subtitle: 'Get exercise tips, parse workouts, and chat with your personal AI coach.',
      image: olympicImage,
      imageAlt: 'AI coaching and training intelligence visual',
      sideLeftImage: fullbodyImage,
      sideRightImage: chestImage,
    },
    '/settings': {
      title: 'Settings',
      subtitle: 'Customize your measurement preferences and training defaults.',
      image: mobilityImage,
      imageAlt: 'Settings and preferences visual',
      sideLeftImage: coreImage,
      sideRightImage: mobilityImage,
    },
    '/admin': {
      title: 'Admin Dashboard',
      subtitle: 'Manage users, subscriptions, and platform metrics.',
      image: olympicImage,
      imageAlt: 'Admin dashboard visual',
      sideLeftImage: fullbodyImage,
      sideRightImage: chestImage,
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
    <>
    {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
    <div className="app-stage">
      <aside className="side-visual side-visual-left" key={`${location.pathname}-left`} aria-hidden="true">
        <img src={pageView.sideLeftImage} alt="" loading="eager" />
      </aside>

      <div className="layout-shell">
        <header className="topbar">
          <LogoMark />
          <nav className="main-nav">
            <div className="user-pill" title={userEmail || 'Logged in user'}>
              <span>User</span>
              <strong>{userLabel}</strong>
            </div>
            <NavLink to="/workouts">Workouts</NavLink>
            <NavLink to="/exercises">Exercises</NavLink>
            <NavLink to="/templates">Templates</NavLink>
            <NavLink to="/body-metrics">Body Metrics</NavLink>
            <NavLink to="/progress">Progress</NavLink>
            <NavLink to="/goals">Goals</NavLink>
            <NavLink to="/ai-coach">AI Coach</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
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
          <div className="page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      <aside className="side-visual side-visual-right" key={`${location.pathname}-right`} aria-hidden="true">
        <img src={pageView.sideRightImage} alt="" loading="eager" />
      </aside>
    </div>
    </>
  );
}
