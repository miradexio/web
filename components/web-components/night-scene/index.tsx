import nightScene from "./night-scene.jpg";

type NightSceneProps = {
  readonly preserveAspectRatio?: string;
};

type Twinkle = {
  readonly left: string;
  readonly top: string;
  readonly size: number;
  readonly duration: string;
};

const TWINKLES: readonly Twinkle[] = [
  { left: "20.5%", top: "11%", size: 3, duration: "3.2s" },
  { left: "49%", top: "6%", size: 4, duration: "4.5s" },
  { left: "91%", top: "8.5%", size: 4, duration: "2.8s" },
  { left: "34%", top: "50%", size: 3, duration: "3.8s" },
];

/* The prop keeps the old SVG contract so consumers stay unchanged:
   "xMidYMid slice" (default) → cover/center, "xMidYMax slice" → cover/bottom. */
function toObjectPosition(preserveAspectRatio: string): string {
  if (preserveAspectRatio.includes("YMax")) return "center bottom";
  if (preserveAspectRatio.includes("YMin")) return "center top";
  return "center";
}

function isBottomAnchored(preserveAspectRatio: string): boolean {
  return preserveAspectRatio.includes("YMax");
}

export function NightScene({
  preserveAspectRatio = "xMidYMid slice",
}: NightSceneProps = {}): React.JSX.Element {
  return (
    <div
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      aria-hidden="true"
    >
      <img
        src={nightScene}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: toObjectPosition(preserveAspectRatio) }}
      />
      {!isBottomAnchored(preserveAspectRatio) &&
        TWINKLES.map((star) => (
          <span
            key={`${star.left}-${star.top}`}
            className="ns-twinkle absolute rounded-full bg-[#F5EDE0]"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDuration: star.duration,
            }}
          />
        ))}
    </div>
  );
}
