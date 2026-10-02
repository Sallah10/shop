export function SetupNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">Supabase is not configured yet</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-800">
        <li>
          Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code>.
        </li>
        <li>
          Fill in <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </li>
        <li>Restart the dev server.</li>
      </ol>
    </div>
  );
}
