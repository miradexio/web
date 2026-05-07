export function NightSceneDefs() {
  return (
    <defs>
      {/* Sky gradient */}
      <linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0E1228" />
        <stop offset="55%" stopColor="#181D33" />
        <stop offset="100%" stopColor="#2A2842" />
      </linearGradient>

      {/* Sand gradient */}
      <linearGradient id="ns-sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4A4560" />
        <stop offset="25%" stopColor="#6B5F6F" />
        <stop offset="55%" stopColor="#9A8870" />
        <stop offset="100%" stopColor="#C9B896" />
      </linearGradient>

      {/* Moon halo gradients */}
      <radialGradient id="ns-moonHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F5EDE0" stopOpacity="0.30" />
        <stop offset="35%" stopColor="#F5EDE0" stopOpacity="0.10" />
        <stop offset="100%" stopColor="#F5EDE0" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ns-moonInner" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F5EDE0" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#F5EDE0" stopOpacity="0" />
      </radialGradient>

      {/* Campfire glow */}
      <radialGradient id="ns-fireGlow" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stopColor="#E8945A" stopOpacity="0.55" />
        <stop offset="60%" stopColor="#C97540" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#E8945A" stopOpacity="0" />
      </radialGradient>

      {/* Lantern window glow */}
      <radialGradient id="ns-windowGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F2C28A" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#E8945A" stopOpacity="0" />
      </radialGradient>

      {/* Bus headlight glow — bright warm beacon */}
      <radialGradient id="ns-headlightGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFAEB" stopOpacity="0.95" />
        <stop offset="20%" stopColor="#F5E6B8" stopOpacity="0.65" />
        <stop offset="50%" stopColor="#F2C28A" stopOpacity="0.30" />
        <stop offset="100%" stopColor="#E8945A" stopOpacity="0" />
      </radialGradient>

      {/* Atmospheric horizon haze */}
      <linearGradient id="ns-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3A3550" stopOpacity="0" />
        <stop offset="100%" stopColor="#5A5070" stopOpacity="0.45" />
      </linearGradient>

      {/* Hand-drawn turbulence filters: scale dictates displacement strength.
          Beyond scale=8 shapes lose recognition — keep as tuned. */}
      <filter id="ns-rough-strong" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="6" />
      </filter>

      <filter id="ns-rough-medium" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" />
        <feDisplacementMap in="SourceGraphic" scale="3" />
      </filter>

      <filter id="ns-rough-subtle" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="15" />
        <feDisplacementMap in="SourceGraphic" scale="2" />
      </filter>
    </defs>
  );
}
