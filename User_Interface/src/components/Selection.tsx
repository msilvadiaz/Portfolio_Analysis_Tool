// src/components/SideMenu.tsx
import type { Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import HamburgerIcon from "./HamburgerIcon";
import toggleButtonStyle from "./toggleButtonStyle";

export type ViewKey = "stockboard";

export default function SideMenu({
  active,
  onChange,
  width = 260,
  isOpen = true,
  onToggle,
}: {
  active: ViewKey;
  onChange: Dispatch<SetStateAction<ViewKey>> | ((v: ViewKey) => void);
  width?: number;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const isStock = active === "stockboard";

  return (
    <aside
      style={{
        width,
        minWidth: width,
        boxSizing: "border-box",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        backgroundColor: "rgba(11, 15, 31, 0.72)",
        border: "1px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(10px)",
        color: "rgba(240,248,255,0.92)",
        padding: "18px 14px",
        zIndex: 6000,
        transition: "transform 260ms ease",
      }}
      aria-hidden={!isOpen}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <motion.button
          type="button"
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          style={{
            ...toggleButtonStyle,
          }}
          aria-label="Hide dashboard"
          title="Hide dashboard"
        >
          <HamburgerIcon />
        </motion.button>
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
        <motion.button
          type="button"
          onClick={() => onChange("stockboard")}
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${
              isStock ? "rgba(125, 252, 186, 0.55)" : "rgba(255,255,255,0.10)"
            }`,
            background: isStock
              ? "rgba(125,211,252,0.12)"
              : "rgba(255,255,255,0.06)",
            color: "rgba(240, 255, 247, 0.95)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">💸</span>
          <span style={{ fontWeight: 600 }}>StockBoard</span>
        </motion.button>

      </nav>

    </aside>
  );
}
