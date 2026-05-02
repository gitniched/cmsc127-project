import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  label: string;
  to:    string;
  icon:  ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to:    ROUTES.dashboard,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: 'Drivers',
    to:    ROUTES.drivers,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'Vehicles',
    to:    ROUTES.vehicles,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 10V7.5L4.5 4h7L14 7.5V10"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="1" y="10" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="4.5" cy="13" r="1" fill="currentColor" />
        <circle cx="11.5" cy="13" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Violations',
    to:    ROUTES.violations,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1.5L14.5 13H1.5L8 1.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    to:    ROUTES.reports,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function NavBar() {
  return (
    <>
      <style>{`
        .nav-wrapper {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 50;
          padding: 40px 16px 40px 12px;
        }

        .nav-sidebar {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 8px;
          width: 53px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow:
            0 2px 8px 0 rgba(0,0,0,0.06),
            0 0 0 0 rgba(0,0,0,0);
          overflow: hidden;
          transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width;
        }

        .nav-wrapper:hover .nav-sidebar {
          width: 168px;
          box-shadow:
            0 4px 24px 0 rgba(0,0,0,0.09),
            0 1px 4px 0 rgba(0,0,0,0.04);
        }

        .nav-divider {
          width: 100%;
          height: 1px;
          background: rgba(226, 232, 240, 0.8);
          margin: 4px 0;
          flex-shrink: 0;
        }

        .nav-logo-btn {
          display: flex;
          align-items: center;
          gap: 0;
          width: 100%;
          height: 36px;
          padding: 0 3px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: default;
        }

        .nav-logo-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-label-text {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 160ms ease,
                      transform 160ms ease;
          margin-left: 10px;
        }

        .nav-wrapper:hover .nav-label-text {
          opacity: 1;
          transform: translateX(0);
          transition: opacity 160ms ease 80ms,
                      transform 160ms ease 80ms;
        }

        .nav-link {
          display: flex;
          align-items: center;
          width: 100%;
          height: 36px;
          padding: 0 3px;
          border-radius: 10px;
          text-decoration: none;
          color: #64748b;
          overflow: hidden;
          flex-shrink: 0;
          transition: background 120ms ease, color 120ms ease;
          gap: 0;
        }

        .nav-link:hover {
          background: rgba(241, 245, 249, 0.95);
          color: #0f172a;
        }

        .nav-link.active {
          background: rgba(239, 246, 255, 0.95);
          color: #2563eb;
        }

        .nav-link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 28px;
          height: 28px;
        }

        .nav-link-label {
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 160ms ease,
                      transform 160ms ease;
          margin-left: 6px;
        }

        .nav-wrapper:hover .nav-link-label {
          opacity: 1;
          transform: translateX(0);
          transition: opacity 160ms ease 80ms,
                      transform 160ms ease 80ms;
        }
      `}</style>

      <div className="nav-wrapper">
        <nav className="nav-sidebar">
          <div className="nav-logo-btn">
            <div className="nav-logo-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 10V5.5L5 2h4l3 3.5V10"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="1" y="10" width="12" height="2.5" rx="0.8" fill="white" />
              </svg>
            </div>
            <span className="nav-label-text">BiyaheDB</span>
          </div>

          <div className="nav-divider" />

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.dashboard}
              className={({ isActive }) =>
                ['nav-link', isActive ? 'active' : ''].join(' ').trim()
              }
            >
              <span className="nav-link-icon">{item.icon}</span>
              <span className="nav-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}