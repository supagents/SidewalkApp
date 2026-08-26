import Link from "next/link";
import { Logo } from "@/components/logo";

export type LegalSection = {
  title: string;
  content: React.ReactNode;
};

export function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-black rounded-xl px-4 py-3.5 text-[15px] leading-relaxed">
      <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1.5">{label}</div>
      {children}
    </div>
  );
}

const labelClass = "text-xs uppercase tracking-widest text-gray-500 font-semibold";

export function LegalLayout({
  title,
  tagline,
  effectiveDate,
  sections,
}: {
  title: string;
  tagline: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="w-full max-w-5xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between gap-4 pt-10 pb-6 border-b-2 border-black flex-wrap">
          <Link href="/">
            <Logo />
          </Link>
          <div className={labelClass + " text-right leading-relaxed"}>
            <div>
              Operated by <span className="text-black font-bold">Sidewalk Strategy</span>
            </div>
            <div>
              Effective <span className="text-black font-bold">{effectiveDate}</span>
            </div>
          </div>
        </div>

        <div className="pt-10 pb-8 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-wrap-balance">
            {title}
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl text-base leading-relaxed">{tagline}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-10 pt-8">
          <nav className="md:w-56 flex-shrink-0">
            <div className={labelClass + " mb-3"}>Contents</div>
            <div className="flex flex-row md:flex-col flex-wrap gap-2 md:gap-1">
              {sections.map((s, i) => (
                <a
                  key={s.title}
                  href={`#s${i + 1}`}
                  className="flex items-baseline gap-2 text-sm font-semibold text-gray-500 hover:text-black border border-transparent hover:border-black rounded-lg px-2.5 py-1.5 md:px-2 md:py-1.5"
                >
                  <span className="text-xs font-bold text-gray-400 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </nav>

          <main className="min-w-0 flex-1">
            {sections.map((s, i) => (
              <section key={s.title} id={`s${i + 1}`} className="py-8 border-b border-gray-200 scroll-mt-6">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-sm font-bold text-gray-400 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="text-xl font-extrabold tracking-tight">{s.title}</h2>
                </div>
                <div className="max-w-[68ch] text-[15px] leading-relaxed text-gray-700 space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-black [&_strong]:font-bold">
                  {s.content}
                </div>
              </section>
            ))}

            <footer className="pt-8 text-sm text-gray-500 leading-relaxed">
              <p>
                Questions? Contact{" "}
                <a href="mailto:juliangents45@gmail.com" className="underline underline-offset-2">
                  juliangents45@gmail.com
                </a>
                .
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
