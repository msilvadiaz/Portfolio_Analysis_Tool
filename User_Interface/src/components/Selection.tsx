// src/components/SideMenu.tsx
import type { Dispatch, SetStateAction } from "react";

export type ViewKey = "stockboard" | "models";

export default function SideMenu({
  active,
  onChange,
  width = 260,
}: {
  active: ViewKey;
  onChange: Dispatch<SetStateAction<ViewKey>> | ((v: ViewKey) => void);
  width?: number;
}) {
  const isStock = active === "stockboard";
  const isModels = active === "models";

  return (
    <aside
      style={{
        width,
        minWidth: width,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        borderRight: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(240,248,255,0.92)",
        padding: "18px 14px",
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
          aria-hidden="true"
        >
          ☰
        </div>
        <div style={{ fontWeight: 700, letterSpacing: 0.4 }}>
          <span style={{ color: "#f7fafb" }}>Dashboard</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 12,
          opacity: 0.75,
          letterSpacing: 1.2,
        }}
      >
        NAVIGATION
      </div>

      <nav style={{ marginTop: 10, display: "grid", gap: 10 }}>
        <button
          type="button"
          onClick={() => onChange("stockboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${
              isStock ? "rgba(125,211,252,0.55)" : "rgba(255,255,255,0.10)"
            }`,
            background: isStock
              ? "rgba(125,211,252,0.12)"
              : "rgba(255,255,255,0.06)",
            color: "rgba(240,248,255,0.95)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">💸</span>
          <span style={{ fontWeight: 600 }}>StockBoard</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("models")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${
              isModels ? "rgba(250, 144, 139, 0.55)" : "rgba(255,255,255,0.10)"
            }`,
            background: isModels
              ? "rgba(167,139,250,0.12)"
              : "rgba(255,255,255,0.06)",
            color: "rgba(240,248,255,0.95)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">📈</span>
          <span style={{ fontWeight: 600 }}>Models</span>
        </button>
      </nav>

      <div style={{ marginTop: 26, opacity: 0.4, fontSize: 12 }}>
        {/* placeholder section like the reference UI */}
        <div style={{ marginBottom: 10, letterSpacing: 1.2 }}>PROJECTS</div>
        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Option
          </div>
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Case
          </div>
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Local
          </div>
        </div>
      </div>
    </aside>
  );
}
