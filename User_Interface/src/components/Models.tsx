import type { GuestStock } from "./Stockboard";

type Props = {
  currentUser: string | null;
  guestStocks: GuestStock[];
};

export default function Models({ currentUser, guestStocks }: Props) {
  return (
    <div
      className="min-vh-100"
      style={{ backgroundColor: "#000", color: "aliceblue" }}
    >
      <div className="container py-4">
        <h1 className="mb-3">Models</h1>

        {!currentUser ? (
          <p className="text-secondary">
            Guest tickers:{" "}
            {guestStocks.map((s) => s.ticker.toUpperCase()).join(", ") ||
              "none"}
          </p>
        ) : (
          <p className="text-secondary">
            Logged in — models will load from PostgreSQL.
          </p>
        )}
      </div>
    </div>
  );
}
