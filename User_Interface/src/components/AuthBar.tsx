type Props = {
  isGuest: boolean;
  onMakeUsername: () => void;
  onHaveUsername: () => void;
};

export default function AuthBar({
  isGuest,
  onMakeUsername,
  onHaveUsername,
}: Props) {
  if (!isGuest) return null;

  return (
    <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
      <button className="btn btn-danger" onClick={onMakeUsername}>
        Make a username
      </button>
      <button className="btn btn-danger" onClick={onHaveUsername}>
        Already have a username
      </button>
      <span className="text-secondary">
        Guest mode: your stocks aren’t saved yet.
      </span>
    </div>
  );
}
