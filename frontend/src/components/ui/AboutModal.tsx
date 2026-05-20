import Modal from '../ui/Modal';

interface AboutModalProps {
  open:    boolean;
  onClose: () => void;
}

const REFERENCES = [
  {
    label: 'R.A. 4136: Land Transportation and Traffic Code (1964)',
    url:   'https://lawphil.net/statutes/repacts/ra1964/ra_4136_1964.html',
  },
  {
    label: 'R.A. 10930 IRR: Driver\'s License Validity Periods',
    url:   'https://lto.gov.ph/wp-content/uploads/2023/09/IRR-RA10930.pdf',
  },
  {
    label: 'LTO APL Form v3: Application for Driver\'s License',
    url:   'https://lto.gov.ph/wp-content/uploads/2023/09/APL-Form_v3.pdf',
  },
  {
    label: 'LTO Driver\'s License Types and Requirements',
    url:   'https://www.globe.com.ph/blog/lto-drivers-license-application-and-renewal',
  },
  {
    label: 'MMDA Revised Fines and Penalties (April 2019)',
    url:   'https://mmda.gov.ph/images/pdf/Home/REVISED-FINES-and-PENALTIES-by-alphabet-new-4-11-2019-01.pdf',
  },
];

const AUTHORS = [
  { name: 'Simone Pauline Dagondon', role: 'Fullstack' },
  { name: 'Nicholas Pacoma',         role: 'Fullstack' },
  { name: 'Justin Lawrence Cruz',    role: 'Fullstack' },
];

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="About BiyaheDB" size="md">
      <style>{`
        .about-section {
          margin-bottom: 20px;
        }
        .about-section:last-child {
          margin-bottom: 0;
        }
        .about-section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 10px;
        }
        .about-description {
          font-size: 13.5px;
          line-height: 1.65;
          color: #475569;
        }
        .about-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          margin-bottom: 12px;
        }
        .about-authors {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .about-author-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
        }
        .about-author-name {
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
        }
        .about-author-role {
          font-size: 12px;
          color: #94a3b8;
        }
        .about-refs {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .about-ref-link {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          text-decoration: none;
          color: #334155;
          font-size: 12.5px;
          line-height: 1.5;
          transition: background 120ms ease, border-color 120ms ease;
        }
        .about-ref-link:hover {
          background: rgba(239, 246, 255, 0.95);
          border-color: rgba(147, 197, 253, 0.6);
          color: #1d4ed8;
        }
        .about-ref-icon {
          flex-shrink: 0;
          margin-top: 1px;
          color: #94a3b8;
        }
        .about-ref-link:hover .about-ref-icon {
          color: #2563eb;
        }
        .about-divider {
          height: 1px;
          background: rgba(226, 232, 240, 0.6);
          margin: 16px 0;
        }
        .about-course {
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          padding-top: 4px;
        }
      `}</style>

      <div className="about-section">
        <div className="about-badge">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 14h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4z" fill="currentColor" opacity="0.3"/>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v4M8 11v0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          CMSC 127, File Processing and Database Systems
        </div>
        <p className="about-description">
          BiyaheDB is an LTO (Land Transportation Office) Information Management System
          designed to support the recording and management of drivers, vehicles, registrations,
          and traffic violations in the Philippines. It simulates a simplified version of
          real-world LTO operations, emphasizing proper database design, data integrity,
          and efficient query processing.
        </p>
      </div>

      <div className="about-divider" />

      <div className="about-section">
        <div className="about-section-label">Developers</div>
        <div className="about-authors">
          {AUTHORS.map((a) => (
            <div className="about-author-row" key={a.name}>
              <span className="about-author-name">{a.name}</span>
              <span className="about-author-role">{a.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="about-divider" />

      <div className="about-section">
        <div className="about-section-label">References</div>
        <div className="about-refs">
          {REFERENCES.map((ref) => (
            <a
              key={ref.url}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="about-ref-link"
            >
              <svg className="about-ref-icon" width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M5.5 2H2.5A1 1 0 0 0 1.5 3v8.5A1 1 0 0 0 2.5 12.5H11A1 1 0 0 0 12 11.5V8.5M8 1.5h4.5V6M7 7.5l5.5-6"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {ref.label}
            </a>
          ))}
        </div>
      </div>

      <div className="about-course">
        Institute of Computer Science · University of the Philippines Los Baños
      </div>
    </Modal>
  );
}