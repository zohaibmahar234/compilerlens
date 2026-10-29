import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Layers,
  GitBranch,
  PlayCircle,
  Binary,
  Code2,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const pipelinePhases = [
    {
      phase: "01",
      name: "Lexical Analysis",
      desc: "Tokenizes source text into a strongly typed stream with exact spans and category classification.",
      icon: Code2,
      badge: "Lexer",
    },
    {
      phase: "02",
      name: "Syntax Analysis",
      desc: "Constructs an unambiguous Abstract Syntax Tree (AST) using recursive-descent and Pratt precedence climbing.",
      icon: GitBranch,
      badge: "Parser",
    },
    {
      phase: "03",
      name: "Semantic Analysis",
      desc: "Performs scope resolution, type verification, variable lifetime checks, and symbol table management.",
      icon: CheckCircle2,
      badge: "Type Checker",
    },
    {
      phase: "04",
      name: "Three-Address Code & CFG",
      desc: "Linearizes expressions into Quadruples (TAC) and partitions code into Basic Blocks for flow graphing.",
      icon: Layers,
      badge: "IR Gen",
    },
    {
      phase: "05",
      name: "Optimization Engine",
      desc: "Performs constant folding, constant propagation, dead-code elimination, and CSE with before/after diffs.",
      icon: Zap,
      badge: "Optimizer",
    },
    {
      phase: "06",
      name: "Bytecode & Stack VM",
      desc: "Emits compact virtual machine instructions with step-by-step operand stack & call-frame visualizer.",
      icon: Binary,
      badge: "VM Runtime",
    },
  ];

  const primaryBtn =
    "inline-flex w-full items-center justify-center gap-3 rounded-sm border border-primary bg-primary px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto";
  const ghostBtn =
    "inline-flex w-full items-center justify-center gap-3 rounded-sm border border-border px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto";

  return (
    <div className="relative overflow-hidden">
      {/* Faint gold halo behind the hero */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_65%)]" />

      {/* Hero */}
      <section className="container max-w-6xl pb-24 pt-24 text-center md:pb-36 md:pt-36">
        <div className="animate-fade-up flex flex-col items-center gap-5">
          <span className="gold-rule" />
          <span className="eyebrow">Interactive Computer Science Education</span>
        </div>

        <h1
          className="animate-fade-up mx-auto mt-10 max-w-4xl text-5xl font-normal leading-[1.05] md:text-7xl"
          style={{ animationDelay: "120ms" }}
        >
          Demystify Compilers.
          <br />
          <span className="text-primary">From Source to Silicon.</span>
        </h1>

        <p
          className="animate-fade-up mx-auto mb-12 mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
          style={{ animationDelay: "240ms" }}
        >
          CompilerLens brings compiler design theory to life. Write MiniLang code and inspect every
          transformation in real time: Tokens, ASTs, Symbol Tables, TAC IR, CFG Graphs,
          Optimizations, and Stack VM execution.
        </p>

        <div
          className="animate-fade-up flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: "360ms" }}
        >
          <Link href="/playground" className={primaryBtn}>
            <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
            Open Interactive Studio
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <Link href="/learn" className={ghostBtn}>
            <Cpu className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Explore Curriculum
          </Link>
        </div>
      </section>

      {/* Pipeline */}
      <section className="container max-w-6xl border-t border-border py-20 md:py-28">
        <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center text-center">
          <span className="gold-rule mb-5" />
          <span className="eyebrow mb-5">The Pipeline</span>
          <h2 className="mb-4 text-3xl font-normal md:text-4xl">
            Every Compiler Phase, Visualized In Real-Time
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            No black boxes. Witness every intermediate representation and formal transition as you
            type.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {pipelinePhases.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.phase}
                className="group bg-background p-8 transition-colors duration-300 hover:bg-card"
              >
                <div className="mb-8 flex items-start justify-between">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.25} />
                  <span className="font-serif text-3xl text-muted-foreground/40 transition-colors group-hover:text-primary/60">
                    {item.phase}
                  </span>
                </div>
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {item.badge}
                </div>
                <h3 className="mb-3 font-serif text-xl">{item.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Demo teaser */}
      <section className="container max-w-6xl border-t border-border py-20 md:py-28">
        <div className="border border-border bg-card p-6 md:p-10">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
            <div>
              <span className="eyebrow">Sample Program</span>
              <h3 className="mt-3 font-serif text-2xl">Recursive Factorial in MiniLang</h3>
            </div>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary transition-opacity hover:opacity-80"
            >
              Run in Playground <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-6 font-mono text-xs lg:grid-cols-3">
            <div className="border border-border bg-background/60 p-4">
              <div className="mb-3 flex justify-between border-b border-border pb-2 text-muted-foreground">
                <span>01. MiniLang Source</span>
                <span className="text-primary">Valid</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed text-foreground/80">
{`function int factorial(int n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

int result = factorial(5);
print("Result:", result);`}
              </pre>
            </div>

            <div className="border border-border bg-background/60 p-4">
              <div className="mb-3 flex justify-between border-b border-border pb-2 text-muted-foreground">
                <span>02. Three-Address Code</span>
                <span className="text-primary">IR</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed text-foreground/80">
{`label factorial:
  t0 = n <= 1
  ifFalse t0 goto L0
  return 1
label L0:
  t1 = n - 1
  param t1
  t2 = call factorial, 1
  t3 = n * t2
  return t3
label main:
  param 5
  t4 = call factorial, 1
  result = t4
  print "Result:", result`}
              </pre>
            </div>

            <div className="border border-border bg-background/60 p-4">
              <div className="mb-3 flex justify-between border-b border-border pb-2 text-muted-foreground">
                <span>03. Bytecode Instructions</span>
                <span className="text-primary">VM</span>
              </div>
              <pre className="overflow-x-auto leading-relaxed text-foreground/80">
{`0000: LOAD 0 (n)
0001: PUSH_INT 1
0002: LTE
0003: JMP_IF_FALSE 0006
0004: PUSH_INT 1
0005: RET
0006: LOAD 0 (n)
0007: LOAD 0 (n)
0008: PUSH_INT 1
0009: SUB
0010: CALL factorial, 1
0011: MUL
0012: RET`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container max-w-4xl py-20 text-center md:py-32">
        <div className="flex flex-col items-center border border-border bg-card px-8 py-16 md:px-16 md:py-20">
          <span className="gold-rule mb-6" />
          <h2 className="mb-5 text-3xl font-normal md:text-5xl">
            Ready to explore inside the compiler?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Start writing MiniLang in the playground, inspect AST node graphs, step through bytecode
            stack execution, or experiment with LL(1) grammar conflict detection in the Grammar Lab.
          </p>
          <Link href="/playground" className={primaryBtn}>
            Launch Compiler Studio
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}
