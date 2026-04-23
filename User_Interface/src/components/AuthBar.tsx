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
      <button className="btn btn-dark" onClick={onMakeUsername}>
        Save portfolio
      </button>
      <button className="btn btn-dark loadPortfolioButton" onClick={onHaveUsername}>
        Load portfolio
      </button>
      <span className="text-light">Guest mode: your stocks aren’t saved.</span>
    </div>
  );
}
