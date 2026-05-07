import { NightSceneBus } from "./bus";
import { NightSceneDefs } from "./defs";
import { NightSceneMoon } from "./moon";
import { NightSceneSand } from "./sand";
import { NightSceneSky } from "./sky";
import { NightSceneTerrain } from "./terrain";
import { NightSceneTumbleweeds } from "./tumbleweeds";

type NightSceneProps = {
  readonly preserveAspectRatio?: string;
};

export function NightScene({ preserveAspectRatio = "xMidYMid slice" }: NightSceneProps = {}) {
  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio={preserveAspectRatio}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <NightSceneDefs />
      <NightSceneSky />
      <NightSceneMoon />
      <NightSceneTerrain />
      <NightSceneSand />
      <NightSceneTumbleweeds />
      <NightSceneBus />
    </svg>
  );
}
