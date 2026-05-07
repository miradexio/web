import type { Quote } from "../../web-components/types";

export type SortMode = "default" | "best" | "fastest";

export type ProtocolFilter = "all" | "thorchain" | "chainflip" | "near_intents" | "atomicswap";

export type ProviderGrade = "S" | "A+" | "A" | "A-" | "B";

export type RouteTag = "best" | "fastest";

export type ProviderInfo = {
  readonly label: string;
  readonly color: string;
  readonly logo?: string;
};

export type ProviderRating = {
  readonly grade: ProviderGrade;
  readonly provider: string;
  readonly body: string;
};

export type ProviderGroup = {
  readonly name: string;
  readonly best: Quote;
  readonly variants: readonly Quote[];
};

export type Headline = {
  readonly label: string;
  readonly dot: string;
};

export type SortOption = {
  readonly id: SortMode;
  readonly label: string;
};

export type ProtocolOption = {
  readonly id: ProtocolFilter;
  readonly label: string;
};

export type TagStyle = {
  readonly label: string;
  readonly cls: string;
};
