// src/App.tsx  (example wiring: switches between Stockboard + Models, and shifts content right)
import { useState } from "react";
import SideMenu, { type ViewKey } from "./components/Selection";
import Stockboard from "./components/Stockboard";
import Models from "./components/Models";

export default function App() {
  const [view, setView] = useState<ViewKey>("stockboard");
  const menuWidth = 260;

  return (
    <div>
      <SideMenu active={view} onChange={setView} width={menuWidth} />

      <main style={{ marginLeft: menuWidth, minHeight: "100vh" }}>
        {view === "stockboard" ? <Stockboard /> : <Models />}
      </main>
    </div>
  );
}
