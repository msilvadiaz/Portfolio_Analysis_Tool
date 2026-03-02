export default function HamburgerIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-grid",
        gap: 5,
        transform: "translateY(-1px)",
      }}
    >
      <span style={{ width: 16, height: 3, borderRadius: 2, background: "currentColor" }} />
      <span style={{ width: 16, height: 3, borderRadius: 2, background: "currentColor" }} />
      <span style={{ width: 16, height: 3, borderRadius: 2, background: "currentColor" }} />
    </span>
  );
}
