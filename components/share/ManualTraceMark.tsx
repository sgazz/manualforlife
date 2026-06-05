import { MANUAL_TRACE_PATH } from "@/lib/signatureShareCard";

type ManualTraceMarkProps = {
  className?: string;
  opacity?: number;
};

export function ManualTraceMark({ className = "", opacity = 0.82 }: ManualTraceMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 420 54"
      fill="none"
      className={className}
      style={{ opacity }}
    >
      <path
        d={MANUAL_TRACE_PATH}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
