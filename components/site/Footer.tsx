export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Northbound. by <a href="https://bello-muhammed.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mb-2">Sallah</a> A small shop for well made everyday things.</p>
        <p>Built with Next.js, Supabase and Tailwind CSS.</p>
      </div>
    </footer>
  );
}
