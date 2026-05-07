import {
  CONSTELLATION,
  STARS_BRIGHT,
  STARS_DIM,
  STARS_MID,
  STAR_BRIGHT_COLORS,
  STAR_DIM_COLORS,
  STAR_MID_COLORS,
  TWINKLE_STARS,
} from "./data";

export function NightSceneSky() {
  return (
    <>
      <rect width="1200" height="600" fill="url(#ns-sky)" />

      {/* Stars — varied colors (white/blue-white/yellow/red giant) and brightness */}
      <g>
        {STARS_DIM.map((s, i) => {
          // Cycle 4 cool/neutral colors for ambient stars
          const colors = STAR_DIM_COLORS;
          return (
            <circle
              key={`d${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={colors[i % colors.length]}
              opacity={s.o}
            />
          );
        })}
      </g>
      <g>
        {STARS_MID.map((s, i) => {
          const colors = STAR_MID_COLORS;
          return (
            <circle
              key={`m${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={colors[i % colors.length]}
              opacity={s.o}
            />
          );
        })}
      </g>
      <g>
        {STARS_BRIGHT.map((s, i) => {
          // Bright stars with variation: white, blue-giant, yellow-sun, red-giant
          const colors = STAR_BRIGHT_COLORS;
          const fill = colors[i % colors.length];
          return (
            <g key={`b${i}`}>
              {/* Tiny halo glow */}
              <circle cx={s.x} cy={s.y} r={s.r * 2.5} fill={fill} opacity={0.18} />
              <circle cx={s.x} cy={s.y} r={s.r} fill={fill} opacity={s.o} />
              {/* Cross-spike — only on the brightest */}
              <line
                x1={s.x - s.r * 3}
                y1={s.y}
                x2={s.x + s.r * 3}
                y2={s.y}
                stroke={fill}
                strokeWidth="0.35"
                opacity="0.45"
              />
              <line
                x1={s.x}
                y1={s.y - s.r * 3}
                x2={s.x}
                y2={s.y + s.r * 3}
                stroke={fill}
                strokeWidth="0.35"
                opacity="0.45"
              />
            </g>
          );
        })}
      </g>
      <g>
        {TWINKLE_STARS.map((s, i) => (
          <circle
            key={`t${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#F5EDE0"
            className="ns-twinkle"
            style={{ animationDuration: s.d }}
          />
        ))}
      </g>

      {/* Constellation */}
      <g>
        <polyline
          points={CONSTELLATION.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#F5EDE0"
          strokeWidth="0.4"
          opacity="0.22"
        />
        {CONSTELLATION.map((p, i) => (
          <circle key={`c${i}`} cx={p.x} cy={p.y} r={1.6} fill="#F5EDE0" opacity={0.95} />
        ))}
      </g>
    </>
  );
}
