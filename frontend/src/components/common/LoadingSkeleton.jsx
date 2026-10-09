export default function LoadingSkeleton({ height = '120px', count = 1 }) {
  return (
    <div className="d-flex flex-column gap-3 w-100">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="c2c-card p-3 rounded-4 bg-light placeholder-glow"
          style={{ height }}
        >
          <div className="placeholder col-7 mb-2 rounded"></div>
          <div className="placeholder col-4 mb-2 rounded"></div>
          <div className="placeholder col-10 rounded"></div>
        </div>
      ))}
    </div>
  );
}
