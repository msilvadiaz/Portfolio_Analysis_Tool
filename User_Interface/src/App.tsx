import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SideMenu, { type ViewKey } from "./components/Selection";
import Stockboard from "./components/Stockboard";
import HamburgerIcon from "./components/HamburgerIcon";
import toggleButtonStyle from "./components/toggleButtonStyle";
import type { GuestStock } from "./types";
import type { SupportedCurrency } from "./utils/currency";

export default function App() {
  const [currency, setCurrency] = useState<SupportedCurrency>(() => {
    const savedCurrency = localStorage.getItem("stockboard_currency");
    return savedCurrency === "USD" ? "USD" : "CAD";
  });
  const [view, setView] = useState<ViewKey>("stockboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() =>
    localStorage.getItem("stockboard_username"),
  );
  const [guestStocks, setGuestStocks] = useState<GuestStock[]>([]);
  const [stockboardLoading, setStockboardLoading] = useState(false);
  const menuWidth = 260;
  const stockboardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    localStorage.setItem("stockboard_currency", currency);
  }, [currency]);

  useEffect(() => {
    const section = stockboardRef.current;
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  const showGlobalLoader = stockboardLoading;

  return (
    <div className="appShell">
      {showGlobalLoader ? (
        <div className="appLoadingIndicator" aria-live="polite" aria-label="Loading">
          <span className="appLoadingSpinner" aria-hidden="true" />
        </div>
      ) : null}

      <SideMenu
        active={view}
        onChange={setView}
        width={menuWidth}
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen((open) => !open)}
      />

      {!isMenuOpen ? (
        <motion.button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Show dashboard"
          title="Show dashboard"
          style={{
            position: "fixed",
            top: 18,
            left: 10,
            ...toggleButtonStyle,
            zIndex: 6100,
          }}
        >
          <HamburgerIcon />
        </motion.button>
      ) : null}

      <main
        style={{
          minHeight: "100vh",
        }}
      >
        <section ref={stockboardRef} className="pageSection">
          <Stockboard
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            guestStocks={guestStocks}
            setGuestStocks={setGuestStocks}
            currency={currency}
            onToggleCurrency={() =>
              setCurrency((prevCurrency) =>
                prevCurrency === "USD" ? "CAD" : "USD",
              )
            }
            onPortfolioUpdated={() => undefined}
            onLoadingChange={setStockboardLoading}
          />
        </section>
      </main>
    </div>
  );
}
