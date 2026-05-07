"use client";

// `<a download>` clicked programmatically silently fails on iOS Safari:
// the download attribute is ignored, the JSON either opens inline or
// shows a cryptic "this site is trying to download a file" prompt that
// doesn't save. For a keystore the user MUST back up, that's data-loss
// territory.
//
// Strategy:
//   1. Web Share API with a File — works on iOS / Android / macOS Safari.
//      Opens the OS share sheet (Save to Files / Drive / etc.).
//   2. <a download> blob fallback — desktop + Android Chrome. target="_blank"
//      so iOS can long-press to share if it ends up here.
//
// User-cancelled share resolves to 'cancelled' so the caller can decide
// whether to retry instead of falling through to a second prompt.

export type DownloadOutcome = "shared" | "downloaded" | "cancelled";

export interface DownloadOptions {
  readonly content: string;
  readonly filename: string;
  /** Defaults to JSON (current callers are keystore + snapshot backups). */
  readonly mimeType?: string;
  /** Title shown in the OS share sheet. Defaults to filename. */
  readonly title?: string;
}

export async function downloadFile(options: DownloadOptions): Promise<DownloadOutcome> {
  const { content, filename, mimeType = "application/json", title } = options;

  // Web Share API first — only path that reliably saves arbitrary blobs on
  // iOS Safari. canShare({ files }) is required because share() exists on iOS
  // but throws on file payloads unless the OS confirms it accepts them.
  const shareOutcome = await tryShare(content, filename, mimeType, title ?? filename);
  if (shareOutcome !== "unsupported") return shareOutcome;

  // Blob URL + anchor click. Desktop and Android.
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    // _blank: iOS users can long-press the tab to share if they end up here.
    anchor.target = "_blank";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // iOS drops the download if the URL is revoked synchronously before the
    // browser schedules the save. 1s is enough.
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
  return "downloaded";
}

async function tryShare(
  content: string,
  filename: string,
  mimeType: string,
  title: string,
): Promise<DownloadOutcome | "unsupported"> {
  if (typeof navigator === "undefined") return "unsupported";

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  if (typeof nav.share !== "function" || typeof nav.canShare !== "function") {
    return "unsupported";
  }

  let file: File;
  try {
    file = new File([content], filename, { type: mimeType });
  } catch {
    // Very old browser without File ctor.
    return "unsupported";
  }

  const shareData: ShareData = { files: [file], title };
  // canShare with `files` can throw on browsers that advertise share
  // support but don't accept file payloads.
  let canShare = false;
  try {
    canShare = nav.canShare(shareData);
  } catch {
    canShare = false;
  }
  if (!canShare) return "unsupported";

  try {
    await nav.share(shareData);
    return "shared";
  } catch (err: unknown) {
    // User-dismissed share throws AbortError; treat as cancelled (not as
    // a failure) so we don't pop a second prompt via the anchor fallback.
    if (err instanceof Error && (err.name === "AbortError" || err.name === "NotAllowedError")) {
      return "cancelled";
    }
    return "unsupported";
  }
}
