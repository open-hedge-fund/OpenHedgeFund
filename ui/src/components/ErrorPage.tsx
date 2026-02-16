"use client";

interface ErrorPageProps {
  code: string;
  title: string;
  description: string;
}

export default function ErrorPage({ code, title, description }: ErrorPageProps) {
  return (
    <div className="error-page">
      <div className="error-page-grid error-page-grid-top">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1, 2, 3, 4].map((col) => (
              <circle
                key={`${row}-${col}`}
                cx={12 + col * 24}
                cy={12 + row * 24}
                r="2.5"
                fill="currentColor"
              />
            )),
          )}
        </svg>
      </div>
      <div className="error-page-grid error-page-grid-bottom">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1, 2, 3, 4].map((col) => (
              <circle
                key={`${row}-${col}`}
                cx={12 + col * 24}
                cy={12 + row * 24}
                r="2.5"
                fill="currentColor"
              />
            )),
          )}
        </svg>
      </div>

      <div className="error-page-content">
        <div className="error-page-code">{code}</div>
        <h1 className="error-page-title">{title}</h1>
        <p className="error-page-description">{description}</p>
        <a href="/" className="btn btn-primary error-page-btn">
          Go Back to Home
        </a>
      </div>
    </div>
  );
}
