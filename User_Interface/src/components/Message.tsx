type Props = {
  variant?: "danger" | "warning" | "success" | "info";
  text: string | null;
  onClose?: () => void;
};

export default function Message({ variant = "danger", text, onClose }: Props) {
  if (!text) return null;
  return (
    <div
      className={`alert alert-${variant} d-flex align-items-center justify-content-between`}
      role="alert"
    >
      <div>{text}</div>
      {onClose && (
        <button
          type="button"
          className="btn btn-sm btn-outline-light ms-3"
          onClick={onClose}
        >
          Close
        </button>
      )}
    </div>
  );
}
