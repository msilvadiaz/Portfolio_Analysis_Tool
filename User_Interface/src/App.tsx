import { useEffect, useRef, useState } from "react";
import SideMenu, { type ViewKey } from "./components/Selection";
import Stockboard from "./components/Stockboard";
import Models from "./components/Models";
import HamburgerIcon from "./components/HamburgerIcon";
import toggleButtonStyle from "./components/toggleButtonStyle";
import type { GuestStock } from "./types";

export default function App() {
  const [view, setView] = useState<ViewKey>("stockboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() =>
    localStorage.getItem("stockboard_username"),
  );
  const [guestStocks, setGuestStocks] = useState<GuestStock[]>([]);
  const [modelsRefreshVersion, setModelsRefreshVersion] = useState(0);
  const menuWidth = 260;
  const stockboardRef = useRef<HTMLElement | null>(null);
  const modelsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = view === "stockboard" ? stockboardRef.current : modelsRef.current;
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  return (
    <div className="appShell">
      <SideMenu
        active={view}
        onChange={setView}
        width={menuWidth}
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen((open) => !open)}
      />

      {!isMenuOpen ? (
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Show dashboard"
          title="Show dashboard"
          style={{
            position: "fixed",
            top: 18,
            left: 10,
            ...toggleButtonStyle,
            zIndex: 30,
          }}
        >
          <HamburgerIcon />
        </button>
      ) : null}

      <main
        style={{
          marginLeft: isMenuOpen ? menuWidth : 0,
          minHeight: "100vh",
          transition: "margin-left 260ms ease",
        }}
      >
        <section ref={stockboardRef} className="pageSection">
          <Stockboard
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            guestStocks={guestStocks}
            setGuestStocks={setGuestStocks}
            onPortfolioUpdated={() =>
              setModelsRefreshVersion((version) => version + 1)
            }
          />
        </section>
        <section ref={modelsRef} className="pageSection">
          <Models
            currentUser={currentUser}
            guestStocks={guestStocks}
            refreshVersion={modelsRefreshVersion}
          />
        </section>
      </main>
    </div>
  );
}
