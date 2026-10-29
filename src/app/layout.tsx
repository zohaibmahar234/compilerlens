import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Code2, BookOpen, Layers, Sparkles, Github } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CompilerLens | Interactive Compiler Pipeline Visualizer",
  description:
    "An AI-powered, educational compiler visualizer for MiniLang. Explore Lexing, AST, Semantic Analysis, TAC IR, CFG, Optimization, Bytecode, and Stack VM execution in real time.",
  keywords: [
    "compiler",
    "AST",
    "control flow graph",
    "intermediate representation",
    "bytecode",
    "virtual machine",
    "compiler design",
    "computer science education",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/25`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
          <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
            <div className="flex items-center gap-10">
              <Link
                href="/"
                className="flex items-center gap-3 transition-opacity hover:opacity-90"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-primary/60 text-primary">
                  <Code2 className="h-4 w-4" strokeWidth={1.25} />
                </div>
                <span className="font-serif text-xl tracking-wide text-foreground">
                  CompilerLens
                </span>
                <span className="hidden border-l border-border pl-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
                  v1.0
                </span>
              </Link>

              <nav className="hidden items-center gap-8 md:flex">
                <Link
                  href="/playground"
                  className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Layers className="h-3.5 w-3.5" strokeWidth={1.25} />
                  Playground
                </Link>
                <Link
                  href="/grammar-lab"
                  className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.25} />
                  Grammar Lab
                </Link>
                <Link
                  href="/learn"
                  className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={1.25} />
                  Learning Hub
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/playground"
                className="inline-flex items-center justify-center rounded-sm border border-primary bg-primary px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Launch Playground
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" strokeWidth={1.25} />
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border py-8 text-xs text-muted-foreground">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="tracking-wide">
              &copy; {new Date().getFullYear()} CompilerLens. Built for compiler
              engineering and computer science pedagogy.
            </p>
            <div className="flex items-center gap-6 uppercase tracking-[0.18em]">
              <Link href="/grammar-lab" className="transition-colors hover:text-primary">
                Grammar
              </Link>
              <Link href="/learn" className="transition-colors hover:text-primary">
                Course
              </Link>
              <Link href="/playground" className="transition-colors hover:text-primary">
                Studio
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}