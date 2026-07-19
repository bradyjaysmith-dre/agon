// Reusable laurel wreath — same paths as the Intro page's wordmark wreath
// (see IntroPage.jsx), generalized to frame arbitrary children at any size.
// Used for badges and the tournament champion banner: the two moments in
// the app that are actually about winning.
export default function Laurel({ size = 96, color = 'var(--olive)', children }) {
  const wreath = (
    <svg
      viewBox="0 0 400 160"
      width={size}
      height={size * 0.4}
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M195 150 C 140 150, 70 130, 45 90 C 25 58, 35 25, 60 15 C 45 35, 42 62, 60 82 C 82 106, 130 118, 195 122"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M205 150 C 260 150, 330 130, 355 90 C 375 58, 365 25, 340 15 C 355 35, 358 62, 340 82 C 318 106, 270 118, 205 122"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );

  if (!children) return wreath;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {wreath}
      <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {children}
      </div>
    </div>
  );
}
