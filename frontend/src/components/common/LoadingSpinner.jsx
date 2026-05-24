export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-2 border-soc-accent/30 border-t-soc-accent rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soc-bg grid-bg">
        <div className="text-center">
          {spinner}
          <p className="mt-4 text-soc-muted text-sm font-mono">Initializing SOC Platform...</p>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center py-8">{spinner}</div>;
}
