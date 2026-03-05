import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef } from "react";

type Props = {
  isOpen: boolean;
  title: string;
  value: string;
  setValue: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  confirmLabel?: string;
};

export default function NamePromptModal({
  isOpen,
  title,
  value,
  setValue,
  onConfirm,
  onCancel,
  isLoading = false,
  disabled = false,
  confirmLabel = "Confirm",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isLoading && !disabled) onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, isLoading, isOpen, onCancel]);

  const controlsDisabled = isLoading || disabled;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1060 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!controlsDisabled) onCancel();
          }}
          aria-modal="true"
          role="dialog"
          aria-labelledby={titleId}
        >
          <motion.div
            className="componentSurface namePromptModalCard text-light w-100"
            style={{ maxWidth: "420px" }}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="h5 mb-3">
              {title}
            </h2>
            <input
              ref={inputRef}
              className="form-control addStockInput namePromptInput mb-3"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Enter portfolio name"
              aria-label="Portfolio name"
              autoCapitalize="none"
              autoComplete="off"
              disabled={controlsDisabled}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!controlsDisabled) onConfirm();
                }
              }}
            />
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onCancel}
                disabled={controlsDisabled}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onConfirm}
                disabled={controlsDisabled}
              >
                {isLoading ? "Working..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
