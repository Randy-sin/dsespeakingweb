export default function Loading() {
  return (
    <main id="main-content" className="mx-auto min-h-[70vh] max-w-[1200px] px-4 py-16 sm:px-7 lg:px-10" aria-busy="true">
      <p role="status" className="eyebrow text-[#48634c]">正在整理你的下一步……</p>
      <div className="mt-6 h-16 max-w-2xl animate-pulse bg-[#e0d8c9]" />
      <div className="mt-4 h-5 max-w-xl animate-pulse bg-[#e8e0cf]" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse border border-[#d7cebd] bg-[#faf7ef]" />)}
      </div>
    </main>
  );
}
