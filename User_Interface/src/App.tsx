import { useState } from "react";
import SideMenu, { type ViewKey } from "./components/Selection";
import Stockboard, { type GuestStock } from "./components/Stockboard";
import Models from "./components/Models";

export default function App() {
  const [view, setView] = useState<ViewKey>("stockboard");
  const [currentUser, setCurrentUser] = useState<string | null>(() =>
    localStorage.getItem("stockboard_username"),
  );
  const [guestStocks, setGuestStocks] = useState<GuestStock[]>([]);
  const menuWidth = 260;

  return (
    <div>
      <SideMenu active={view} onChange={setView} width={menuWidth} />

      <main style={{ marginLeft: menuWidth, minHeight: "100vh" }}>
        {view === "stockboard" ? (
          <Stockboard
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            guestStocks={guestStocks}
            setGuestStocks={setGuestStocks}
          />
        ) : (
          <Models
            currentUser={currentUser}
            guestStocks={guestStocks}
          />
        )}
      </main>
    </div>
  );
}
