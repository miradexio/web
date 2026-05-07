import type { Token } from "../types";

export type Category = "all" | "favorites" | "recents";

export type TokenPickerModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect: (token: Token) => void;
  readonly tokens: readonly Token[];
  readonly excludeToken?: Token | null;
};
