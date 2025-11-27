<svg
  width="320"
  height="320"
  viewBox="0 0 320 320"
  className="drop-shadow-2xl"
  style={{
    filter: 'drop-shadow(0 0 40px rgba(74,222,128,0.5))',
  }}
>
  {/* Body */}
  <ellipse
    cx="160"
    cy="200"
    rx="90"
    ry="70"
    fill="#4ade80"
  />
  
  {/* Head */}
  <circle
    cx="160"
    cy="130"
    r="60"
    fill="#4ade80"
  />
  
  {/* Spikes */}
  {[0, 1, 2, 3, 4, 5].map((i) => (
    <polygon
      key={i}
      points={`${120 + i * 18},170 ${127 + i * 18},145 ${134 + i * 18},170`}
      fill="#22c55e"
    />
  ))}
  
  {/* Eye */}
  <circle cx="180" cy="120" r="12" fill="#0d2920" />
  <circle cx="182" cy="118" r="4" fill="white" />
  
  {/* Smile */}
  <path
    d="M 145 140 Q 160 150 175 140"
    stroke="#0d2920"
    strokeWidth="4"
    fill="none"
    strokeLinecap="round"
  />
  
  {/* Front legs */}
  <ellipse cx="130" cy="250" rx="18" ry="35" fill="#4ade80" />
  <ellipse cx="190" cy="250" rx="18" ry="35" fill="#4ade80" />
  
  {/* Tail */}
  <path
    d="M 90 200 Q 50 210 30 185"
    stroke="#4ade80"
    strokeWidth="25"
    fill="none"
    strokeLinecap="round"
  />
  
  {/* Radar circle on body */}
  <circle
    cx="160"
    cy="190"
    r="25"
    fill="none"
    stroke="#22c55e"
    strokeWidth="3"
  />
  <circle
    cx="160"
    cy="190"
    r="8"
    fill="#22c55e"
  />
</svg>