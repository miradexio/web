export function NightSceneBus() {
  return (
    <>
      <g transform="translate(280, 432) scale(1.25)">
        {/* Wheel tracks behind bus, fading into distance — suggests it just rolled in */}
        <g stroke="#3A3550" strokeWidth="1.2" opacity="0.42" fill="none" filter="url(#ns-rough-subtle)">
          <path d="M 14 64 Q 8 95, -2 140" />
          <path d="M 66 64 Q 72 95, 82 140" />
        </g>

        {/* Soft amber ground pool from headlights */}
        <ellipse cx="40" cy="65" rx="55" ry="7" fill="#E8945A" opacity="0.28" />
        <ellipse cx="40" cy="68" rx="44" ry="4" fill="#F2C28A" opacity="0.22" />

        <g filter="url(#ns-rough-medium)">
          {/* Roof rack support struts */}
          <line x1="14" y1="14" x2="14" y2="6" stroke="#2A2436" strokeWidth="0.8" />
          <line x1="66" y1="14" x2="66" y2="6" stroke="#2A2436" strokeWidth="0.8" />

          {/* Roof rack platform */}
          <rect x="12" y="6" width="56" height="3" rx="0.5" fill="#3D3340" />

          {/* Cargo on roof — luggage, rope-tied bundles, suggests long journey */}
          <rect x="16" y="2" width="14" height="5" rx="0.6" fill="#5C5040" />
          <line x1="16" y1="4.5" x2="30" y2="4.5" stroke="#3A2F25" strokeWidth="0.4" opacity="0.7" />
          <rect x="32" y="0" width="11" height="7" rx="0.6" fill="#473D30" />
          <rect x="46" y="3" width="9" height="4" rx="0.4" fill="#5A4530" />
          <rect x="58" y="1" width="8" height="6" rx="0.5" fill="#403628" />
          {/* Rope details */}
          <line x1="18" y1="2" x2="20" y2="6" stroke="#3A2F25" strokeWidth="0.3" opacity="0.7" />
          <line x1="50" y1="3" x2="52" y2="7" stroke="#3A2F25" strokeWidth="0.3" opacity="0.7" />

          {/* Roof — slight tilt suggests dent/sag from years */}
          <path d="M 6 14 L 74 13 L 75 19 L 5 20 Z" fill="#2A2436" />
          <path d="M 6 14 L 74 13" stroke="#5A4D5A" strokeWidth="0.6" opacity="0.5" />

          {/* Main body — faded earthen brown, lots of wear */}
          <path d="M 10 19 L 70 19 Q 73 19, 73 22 L 73 60 Q 73 62, 71 62 L 9 62 Q 7 62, 7 60 L 7 22 Q 7 19, 10 19 Z" fill="#4A3F38" />

          {/* Ink outline — visible hand-drawn edge */}
          <path d="M 10 19 L 70 19 Q 73 19, 73 22 L 73 60 Q 73 62, 71 62 L 9 62 Q 7 62, 7 60 L 7 22 Q 7 19, 10 19 Z" fill="none" stroke="#0E1228" strokeWidth="0.9" opacity="0.85" />

          {/* Body weathering — darker patches (dirt accumulation) */}
          <ellipse cx="22" cy="48" rx="9" ry="3" fill="#2E2530" opacity="0.55" />
          <ellipse cx="56" cy="44" rx="7" ry="2.8" fill="#2E2530" opacity="0.5" />
          <ellipse cx="40" cy="58" rx="11" ry="2" fill="#2E2530" opacity="0.45" />

          {/* Rust patches — terracotta spots */}
          <ellipse cx="13" cy="38" rx="2.2" ry="1.6" fill="#7A4A2E" opacity="0.75" />
          <ellipse cx="11" cy="41" rx="1" ry="0.7" fill="#5C3A24" opacity="0.7" />
          <ellipse cx="68" cy="50" rx="2" ry="1.4" fill="#7A4A2E" opacity="0.7" />
          <ellipse cx="70" cy="52" rx="0.8" ry="0.5" fill="#5C3A24" opacity="0.65" />
          <ellipse cx="48" cy="56" rx="1.6" ry="1" fill="#7A4A2E" opacity="0.65" />
          <ellipse cx="34" cy="35" rx="1.2" ry="0.8" fill="#7A4A2E" opacity="0.6" />

          {/* Dust streaks — vertical sand-tinted lines */}
          <line x1="18" y1="22" x2="18" y2="58" stroke="#C9B896" strokeWidth="0.4" opacity="0.18" />
          <line x1="28" y1="22" x2="28" y2="58" stroke="#C9B896" strokeWidth="0.4" opacity="0.14" />
          <line x1="40" y1="22" x2="40" y2="58" stroke="#C9B896" strokeWidth="0.4" opacity="0.12" />
          <line x1="52" y1="22" x2="52" y2="58" stroke="#C9B896" strokeWidth="0.4" opacity="0.16" />
          <line x1="62" y1="22" x2="62" y2="58" stroke="#C9B896" strokeWidth="0.4" opacity="0.18" />

          {/* Dent — small darker irregular shape */}
          <path d="M 30 30 Q 34 28, 38 30 Q 36 32, 30 32 Z" fill="#2A2025" opacity="0.55" />
          <path d="M 60 33 Q 63 31.5, 66 33 Q 64 34.5, 60 34.5 Z" fill="#2A2025" opacity="0.5" />

          {/* Windshield housing — split, vintage */}
          <rect x="13" y="20" width="54" height="15" rx="1.5" fill="#1A1F35" />
          {/* Windshield amber glow */}
          <rect x="13" y="20" width="54" height="15" rx="1.5" fill="url(#ns-windowGlow)" opacity="0.75" />
          <rect x="15" y="22" width="50" height="11" rx="0.8" fill="#E8945A" />
          {/* Split center divider */}
          <line x1="40" y1="22" x2="40" y2="33" stroke="#1A1F35" strokeWidth="1" />
          {/* Windshield wipers */}
          <line x1="22" y1="33" x2="33" y2="22" stroke="#1A1F35" strokeWidth="0.6" opacity="0.65" />
          <line x1="46" y1="33" x2="58" y2="22" stroke="#1A1F35" strokeWidth="0.6" opacity="0.65" />
          {/* Top trim — chrome with tarnish */}
          <line x1="13" y1="20" x2="67" y2="20" stroke="#7A6E5C" strokeWidth="0.7" opacity="0.6" />
          {/* Crack in windshield (battle scar) */}
          <path d="M 24 25 L 28 28 L 32 26" stroke="#1A1F35" strokeWidth="0.4" opacity="0.7" fill="none" />

          {/* Side mirrors — sticking out */}
          <line x1="9" y1="24" x2="4" y2="24" stroke="#2A2436" strokeWidth="0.5" />
          <ellipse cx="3" cy="24" rx="2" ry="1.4" fill="#3D3340" />
          <ellipse cx="3" cy="24" rx="1.2" ry="0.8" fill="#5A4D5A" opacity="0.7" />

          <line x1="71" y1="24" x2="76" y2="24" stroke="#2A2436" strokeWidth="0.5" />
          <ellipse cx="77" cy="24" rx="2" ry="1.4" fill="#3D3340" />
          <ellipse cx="77" cy="24" rx="1.2" ry="0.8" fill="#5A4D5A" opacity="0.7" />

          {/* Grille — horizontal slats below windshield */}
          <line x1="22" y1="40" x2="58" y2="40" stroke="#1A1F35" strokeWidth="0.6" opacity="0.75" />
          <line x1="22" y1="42.5" x2="58" y2="42.5" stroke="#1A1F35" strokeWidth="0.6" opacity="0.65" />
          <line x1="22" y1="45" x2="58" y2="45" stroke="#1A1F35" strokeWidth="0.6" opacity="0.55" />
          <line x1="22" y1="47.5" x2="58" y2="47.5" stroke="#1A1F35" strokeWidth="0.6" opacity="0.45" />

          {/* Brand emblem — small circle in middle of grille */}
          <circle cx="40" cy="43" r="1.6" fill="#7A6E5C" opacity="0.6" />

          {/* Bumper */}
          <rect x="8" y="56" width="64" height="3" rx="0.8" fill="#2A2436" />
          <rect x="8" y="56" width="64" height="1" fill="#7A6E5C" opacity="0.45" />

          {/* License plate — old, faded */}
          <rect x="33" y="58.5" width="14" height="3.5" rx="0.4" fill="#D4A574" />
          <rect x="33" y="58.5" width="14" height="3.5" rx="0.4" fill="none" stroke="#5C5040" strokeWidth="0.3" opacity="0.8" />
        </g>

        {/* Headlights — radiant warm beacons (much more dramatic) */}
        {/* Far atmospheric halo — bleeds into the night */}
        <circle cx="18" cy="52" r="38" fill="url(#ns-headlightGlow)" opacity="0.85" />
        <circle cx="62" cy="52" r="38" fill="url(#ns-headlightGlow)" opacity="0.85" />

        {/* Mid glow — warm aura */}
        <circle cx="18" cy="52" r="18" fill="url(#ns-headlightGlow)" />
        <circle cx="62" cy="52" r="18" fill="url(#ns-headlightGlow)" />

        {/* Forward light beams — wider wedges casting onto sand */}
        <ellipse cx="18" cy="62" rx="22" ry="6" fill="#F2C28A" opacity="0.32" />
        <ellipse cx="62" cy="62" rx="22" ry="6" fill="#F2C28A" opacity="0.32" />
        <ellipse cx="18" cy="68" rx="14" ry="4" fill="#F5E6B8" opacity="0.22" />
        <ellipse cx="62" cy="68" rx="14" ry="4" fill="#F5E6B8" opacity="0.22" />

        {/* Tight inner glow — bright lens */}
        <circle cx="18" cy="52" r="10" fill="#F5E6B8" opacity="0.70" />
        <circle cx="62" cy="52" r="10" fill="#F5E6B8" opacity="0.70" />

        {/* Lamp body — saturated amber */}
        <circle cx="18" cy="52" r="5" fill="#F2C28A" />
        <circle cx="62" cy="52" r="5" fill="#F2C28A" />

        {/* Inner hot core */}
        <circle cx="18" cy="52" r="3" fill="#FFFAEB" />
        <circle cx="62" cy="52" r="3" fill="#FFFAEB" />

        {/* Brightest pinpoint */}
        <circle cx="18" cy="52" r="1.4" fill="#FFFFFF" />
        <circle cx="62" cy="52" r="1.4" fill="#FFFFFF" />

        {/* Lens flare — 4-point starburst on each headlight */}
        <line x1="6" y1="52" x2="30" y2="52" stroke="#FFFAEB" strokeWidth="0.5" opacity="0.55" />
        <line x1="18" y1="40" x2="18" y2="64" stroke="#FFFAEB" strokeWidth="0.5" opacity="0.55" />
        <line x1="50" y1="52" x2="74" y2="52" stroke="#FFFAEB" strokeWidth="0.5" opacity="0.55" />
        <line x1="62" y1="40" x2="62" y2="64" stroke="#FFFAEB" strokeWidth="0.5" opacity="0.55" />

        {/* Wheels — visible from front view, weathered */}
        <ellipse cx="14" cy="63" rx="6" ry="3.8" fill="#1A1F35" />
        <ellipse cx="14" cy="63" rx="3" ry="2" fill="#3A3550" />
        <ellipse cx="14" cy="63" rx="1.2" ry="0.8" fill="#7A6E5C" opacity="0.6" />

        <ellipse cx="66" cy="63" rx="6" ry="3.8" fill="#1A1F35" />
        <ellipse cx="66" cy="63" rx="3" ry="2" fill="#3A3550" />
        <ellipse cx="66" cy="63" rx="1.2" ry="0.8" fill="#7A6E5C" opacity="0.6" />

        {/* Antenna — bent slightly (weathered) */}
        <path d="M 40 6 Q 42 -2, 40 -10" stroke="#3A3550" strokeWidth="0.7" fill="none" />
        <circle cx="40" cy="-10" r="0.9" fill="#E8945A" />
      </g>
    </>
  );
}
