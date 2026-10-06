/** Logo Pizza Time : la part de pizza (même dessin que le favicon src/app/icon.svg) suivie du nom. */
export function Logo() {
  return (
    <span className="logo">
      <svg className="logo-embleme" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M11 19 Q32 8 53 19 L32 57 Z" fill="#ffc94a" stroke="#ffc94a" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 17 Q32 5 55 17" fill="none" stroke="#e09a3e" strokeWidth="7" strokeLinecap="round" />
        <circle cx="24" cy="27" r="4.5" fill="#c8102e" />
        <circle cx="39" cy="28" r="4" fill="#c8102e" />
        <circle cx="31" cy="41" r="3.5" fill="#c8102e" />
      </svg>
      <span className="logo-texte">
        <span className="logo-nom">Pizza Time</span>
        <span className="logo-sous-titre">Fiches journalières</span>
      </span>
    </span>
  );
}
