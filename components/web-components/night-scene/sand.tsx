import { SAND_STIPPLES_DARK, SAND_STIPPLES_LIGHT } from "./data";

export function NightSceneSand() {
  return (
    <>
      <rect x="0" y="478" width="1200" height="122" fill="url(#ns-sand)" />
      <g filter="url(#ns-rough-strong)">
        {/* Back dune — irregular gentle waves */}
        <path
          d="M -20 502
             Q 80 484, 180 502
             Q 290 488, 380 506
             Q 460 490, 560 504
             Q 660 486, 770 502
             Q 870 492, 970 504
             Q 1080 488, 1230 502
             L 1230 528 L -20 528 Z"
          fill="#776850"
          opacity="0.50"
        />

        {/* Mid dune — bigger swells */}
        <path
          d="M -20 540
             Q 110 514, 230 540
             Q 350 520, 470 542
             Q 580 522, 700 544
             Q 820 524, 940 544
             Q 1070 528, 1230 542
             L 1230 568 L -20 568 Z"
          fill="#94815E"
          opacity="0.50"
        />

        {/* Front dune — closest, biggest swells */}
        <path
          d="M -20 578
             Q 140 552, 280 578
             Q 420 558, 580 580
             Q 720 562, 880 582
             Q 1040 564, 1230 578
             L 1230 600 L -20 600 Z"
          fill="#A89270"
          opacity="0.55"
        />
      </g>

      {/* Sand tonal variation — irregular lighter & darker watercolor patches */}
      <g filter="url(#ns-rough-medium)">
        <ellipse cx="240" cy="510" rx="140" ry="22" fill="#E8DCC0" opacity="0.18" />
        <ellipse cx="450" cy="540" rx="180" ry="28" fill="#7A6850" opacity="0.30" />
        <ellipse cx="680" cy="498" rx="150" ry="20" fill="#E8DCC0" opacity="0.16" />
        <ellipse cx="900" cy="555" rx="180" ry="26" fill="#7A6850" opacity="0.28" />
        <ellipse cx="1100" cy="510" rx="120" ry="20" fill="#E8DCC0" opacity="0.15" />
        <ellipse cx="120" cy="565" rx="160" ry="24" fill="#5A4F60" opacity="0.30" />
        <ellipse cx="540" cy="582" rx="200" ry="18" fill="#C9B896" opacity="0.18" />
        <ellipse cx="850" cy="588" rx="180" ry="20" fill="#7A6850" opacity="0.25" />
      </g>

      {/* Sand stippling — dark pebbles */}
      <g fill="#3A3550">
        {SAND_STIPPLES_DARK.map((s, i) => (
          <circle key={`sd${i}`} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>

      {/* Sand stippling — light grains catching moonlight */}
      <g fill="#E8DCC0">
        {SAND_STIPPLES_LIGHT.map((s, i) => (
          <circle key={`sl${i}`} cx={s.x} cy={s.y} r={s.r * 0.7} opacity={s.o * 0.8} />
        ))}
      </g>
    </>
  );
}
