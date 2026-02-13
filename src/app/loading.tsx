export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
      <img
        src="/street-logo2.png"
        alt="Exposure"
        className="h-10 animate-pulse"
      />
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
      </div>
    </div>
  );
}
