export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Sidewalk
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500 sm:text-base">
        App shell running. Firebase Auth and Firestore are wired up — see{" "}
        <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/[.08]">
          src/lib/firebase.ts
        </code>
        .
      </p>
    </main>
  );
}
