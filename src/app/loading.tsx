export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <p className="font-serif text-lg font-normal tracking-wide text-zinc-600 animate-brand-pulse">
        Exposure
      </p>
      <div className="mt-6 h-px w-48 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full w-1/3 rounded-full bg-violet-500 animate-loading-crawl" />
      </div>
    </div>
  );
}
