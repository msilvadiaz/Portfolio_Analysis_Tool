import { useEffect, useRef, useState } from "react";
import SideMenu, { type ViewKey } from "./components/Selection";
import Stockboard from "./components/Stockboard";
import Models from "./components/Models";
import type { GuestStock } from "./types";

export default function App() {
  const [view, setView] = useState<ViewKey>("stockboard");
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
    <div>
      <SideMenu active={view} onChange={setView} width={menuWidth} />

      <main style={{ marginLeft: menuWidth, minHeight: "100vh" }}>
        <section ref={stockboardRef}>
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
        <section ref={modelsRef}>
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
