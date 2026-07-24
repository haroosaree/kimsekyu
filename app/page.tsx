export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 font-sans text-stone-900">
      <section className="max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase">
          Kim Sekyu Real Estate
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Hello, Chicago.
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-600">
          A thoughtful real-estate experience is on its way.
        </p>
        <a className="mt-10 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700" href="/admin">
          Open CMS
        </a>
      </section>
    </main>
  );
}
