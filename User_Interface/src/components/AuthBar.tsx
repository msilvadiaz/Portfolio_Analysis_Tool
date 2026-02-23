type Props = {
  isGuest: boolean;
  onMakeUsername: () => void;
  onHaveUsername: () => void;
  onSignOut: () => void;
};

export default function AuthBar({
  isGuest,
  onMakeUsername,
  onHaveUsername,
  onSignOut,
}: Props) {
  return (
    <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
      {isGuest ? (
        <>
          <button className="btn btn-dark" onClick={onMakeUsername}>
            Make a username
          </button>
          <button className="btn btn-dark" onClick={onHaveUsername}>
            Already have a username
          </button>
          <span className="text-light">
            Guest mode: your stocks aren’t saved yet.
          </span>
        </>
      ) : (
        <button className="btn btn-dark" onClick={onSignOut}>
          Sign out
        </button>
      )}
    </div>
  );
}
