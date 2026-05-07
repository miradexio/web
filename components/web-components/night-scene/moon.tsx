export function NightSceneMoon() {
  return (
    <>
      {/* Asymmetric outer halo */}
      <ellipse cx="895" cy="118" rx="195" ry="170" fill="url(#ns-moonHalo)" opacity="0.85" />
      <ellipse cx="908" cy="128" rx="155" ry="175" fill="url(#ns-moonHalo)" opacity="0.7" />
      <ellipse cx="900" cy="120" r="100" fill="url(#ns-moonInner)" />

      <g filter="url(#ns-rough-subtle)">
        <path
          d="M 900 62
             C 932 62, 958 86, 959 119
             C 960 151, 934 177, 900 178
             C 866 179, 842 152, 843 120
             C 844 88, 868 62, 900 62 Z"
          fill="#F5EDE0"
        />

        {/* Terminator shadow */}
        <path
          d="M 900 62
             C 880 65, 858 85, 851 112
             C 846 140, 858 165, 880 175
             C 875 170, 862 148, 863 119
             C 864 92, 880 70, 900 62 Z"
          fill="#1A1F35"
          opacity="0.18"
        />

        {/* Painterly surface mares */}
        <ellipse cx="885" cy="105" rx="9" ry="6" transform="rotate(15 885 105)" fill="#C8B89E" opacity="0.45" />
        <ellipse cx="918" cy="128" rx="7" ry="5" transform="rotate(-22 918 128)" fill="#C8B89E" opacity="0.40" />
        <path d="M 890 137 Q 897 132, 905 138 Q 900 145, 890 137 Z" fill="#C8B89E" opacity="0.35" />
        <ellipse cx="918" cy="98" rx="4" ry="3" transform="rotate(40 918 98)" fill="#C8B89E" opacity="0.40" />
        <ellipse cx="908" cy="153" rx="5" ry="3.5" transform="rotate(-15 908 153)" fill="#C8B89E" opacity="0.32" />

        {/* Tiny craters */}
        <circle cx="880" cy="113" r="1.2" fill="#A89A80" opacity="0.55" />
        <circle cx="925" cy="140" r="1" fill="#A89A80" opacity="0.50" />
        <circle cx="895" cy="150" r="0.9" fill="#A89A80" opacity="0.45" />

        {/* Warm rim atmospheric glow */}
        <path
          d="M 900 62
             C 932 62, 958 86, 959 119
             C 960 151, 934 177, 900 178
             C 866 179, 842 152, 843 120
             C 844 88, 868 62, 900 62 Z"
          fill="none"
          stroke="#F5DDB0"
          strokeWidth="0.8"
          opacity="0.45"
        />
      </g>
    </>
  );
}
