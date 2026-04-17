"use client";

import { useEffect } from "react";

type PurposeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PurposeModal({ isOpen, onClose }: PurposeModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Close purpose explanation"
        title="Close"
        onClick={onClose}
        className="bf-modal-scrim absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pl-[max(1.5rem,env(safe-area-inset-left,0px))] pr-[max(1.5rem,env(safe-area-inset-right,0px))] pt-[max(2.5rem,env(safe-area-inset-top,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Why this exists"
          className="pointer-events-auto w-full max-w-[60ch] rounded-2xl bg-(--theme-surface)/96 px-8 py-10 text-center shadow-(--theme-shadow-soft) transition-[opacity,transform,box-shadow] duration-300 ease-in-out sm:px-10 sm:py-12"
        >
          <h2 className="mb-8 text-sm tracking-[0.14em] uppercase text-(--theme-muted)/80">
            Why this exists
          </h2>
          <p className="font-serif text-xl leading-9 text-(--theme-text)/90 sm:text-2xl sm:leading-10">
            Some things deserve to be remembered. Manualfor.life is where you put them.
          </p>
          <p className="mt-6 font-serif text-xl leading-9 text-(--theme-text)/88 sm:text-2xl sm:leading-10">
            ...a thought, a lesson, a truth...
          </p>
          <p className="mt-6 font-serif text-xl leading-9 text-(--theme-text)/86 sm:text-2xl sm:leading-10">
            ...not for now - but for those who come after.
          </p>
          <p className="mt-8 text-center font-serif text-lg leading-8 text-(--theme-muted)/85 sm:text-xl sm:leading-9">
            The deepest truths are often the shortest.
            <br />
            175 characters.
            <br />
            Say what matters.
          </p>
        </section>
      </div>
    </div>
  );
}
