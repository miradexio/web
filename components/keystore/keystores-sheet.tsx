"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { KeystoreMetadata } from "@miradexio/client";
import { listKeystoreMetadata, removeKeystore } from "@/lib/miradex-web/idb";
import { KeystoresSheetHeader } from "./keystores-sheet-header";
import { KeystoresSheetList } from "./keystores-sheet-list";
import { KeystoresSheetDetail } from "./keystores-sheet-detail";
import { KeystoresSheetConfirmDelete } from "./keystores-sheet-confirm-delete";

interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

// Overlays the current swap context (no route change). Lists every atomic
// keystore; rows expand to detail (Wallet/Balance/Sweep/Resume/Download/Delete).
// Folded into one modal because mobile has no sidebar to anchor a list.
export function KeystoresSheet({ open, onClose }: SheetProps): React.JSX.Element | null {
  const [keystores, setKeystores] = useState<readonly KeystoreMetadata[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reloadList = useCallback((): void => {
    void listKeystoreMetadata()
      .then((list) => setKeystores(list))
      .catch(() => setKeystores([]));
  }, []);

  // Reload on open: cheap IndexedDB read, makes a fresh keystore visible
  // when the backup prompt closes mid-swap.
  useEffect(() => {
    if (!open) return;
    reloadList();
  }, [open, reloadList]);

  // Drop the detail selection on close so the next open lands on the list.
  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setConfirmDeleteId(null);
    }
  }, [open]);

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    try {
      await removeKeystore(id);
      reloadList();
      // Drop back to list if we deleted the open detail.
      if (selectedId === id) setSelectedId(null);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, selectedId, reloadList]);

  const confirmTarget =
    confirmDeleteId !== null
      ? (keystores ?? []).find((k) => k.id === confirmDeleteId) ?? null
      : null;

  // Esc dismiss (matches HistoryModal). Order: confirm -> list -> close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      if (confirmDeleteId !== null) {
        setConfirmDeleteId(null);
      } else if (selectedId !== null) {
        setSelectedId(null);
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selectedId, confirmDeleteId, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keystores"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-2xl border border-line-2 bg-bg shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <KeystoresSheetHeader
          inDetail={selectedId !== null}
          onBack={() => setSelectedId(null)}
          onClose={onClose}
        />
        {selectedId === null ? (
          <KeystoresSheetList
            keystores={keystores}
            onSelect={(id) => setSelectedId(id)}
            onDelete={(id) => setConfirmDeleteId(id)}
          />
        ) : (
          <KeystoresSheetDetail
            id={selectedId}
            onAfterAction={onClose}
            onDelete={(id) => setConfirmDeleteId(id)}
          />
        )}
        {confirmTarget !== null && (
          <KeystoresSheetConfirmDelete
            keystore={confirmTarget}
            busy={deletingId === confirmTarget.id}
            onCancel={() => setConfirmDeleteId(null)}
            onConfirm={() => void handleConfirmDelete()}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
