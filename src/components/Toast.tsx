"use client";

type Props = {
  message: string;
};

export default function Toast({ message }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#172B4D",
        color: "#fff",
        borderRadius: 6,
        padding: "10px 22px",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
        zIndex: 9999,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        animation: "toast-slide-up 0.2s ease",
      }}
    >
      {message}
    </div>
  );
}
