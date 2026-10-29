export interface CodeExample {
  id: string;
  name: string;
  category: "Algorithms" | "Control Flow" | "Basics";
  description: string;
  code: string;
}

export const EXAMPLES: CodeExample[] = [
  {
    id: "factorial",
    name: "Recursive Factorial",
    category: "Algorithms",
    description: "Computes factorial using recursive function calls with base-case check.",
    code: `// Recursive Factorial in MiniLang
function int factorial(int n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

int n = 5;
int result = factorial(n);
print("Factorial of", n, "is:", result);
`,
  },
  {
    id: "fibonacci",
    name: "Fibonacci Sequence",
    category: "Algorithms",
    description: "Calculates the nth Fibonacci number recursively.",
    code: `// Fibonacci Sequence
function int fibonacci(int n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

int term = 7;
int val = fibonacci(term);
print("Fibonacci term", term, "is:", val);
`,
  },
  {
    id: "primes",
    name: "Prime Number Checker",
    category: "Algorithms",
    description: "Determines if a number is prime using a while-loop trial division.",
    code: `// Prime Number Checker
function bool isPrime(int n) {
  if (n <= 1) {
    return false;
  }
  int i = 2;
  while (i * i <= n) {
    if (n % i == 0) {
      return false;
    }
    i = i + 1;
  }
  return true;
}

int candidate = 17;
bool prime = isPrime(candidate);
if (prime) {
  print(candidate, "is prime!");
} else {
  print(candidate, "is NOT prime!");
}
`,
  },
  {
    id: "gcd",
    name: "Greatest Common Divisor (GCD)",
    category: "Algorithms",
    description: "Euclid's algorithm for computing the greatest common divisor.",
    code: `// Euclidean Algorithm for GCD
function int gcd(int a, int b) {
  while (b != 0) {
    int temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

int x = 48;
int y = 18;
int divisor = gcd(x, y);
print("GCD of", x, "and", y, "is:", divisor);
`,
  },
  {
    id: "optimizer-demo",
    name: "Optimization Showcase",
    category: "Control Flow",
    description: "Program with dead code, constant expressions, and algebraic simplifications.",
    code: `// Optimizer Lab Demonstration
// Observe constant folding, propagation, and dead code elimination:
int a = 10 + 5 * 2;   // Folded to 20
int b = a + 0;        // Algebraic identity -> b = a -> b = 20
int unused = 999;     // Dead code: never read

if (true) {
  int live = b * 1;
  print("Optimized value:", live);
} else {
  print("This branch is unreachable!");
}
`,
  },
  {
    id: "types-scopes",
    name: "Types & Scopes",
    category: "Basics",
    description: "Demonstrates float widening, strings, booleans, and block scope shadowing.",
    code: `// Types and Nested Scope Shadowing
int globalCount = 10;
float pi = 3.1415;
string greeting = "Hello, CompilerLens!";
bool flag = true;

{
  // Inner block scope shadowing
  string globalCount = "I shadow the global integer!";
  print(globalCount);
}

print(greeting);
print("Global count remains:", globalCount);
`,
  },
];
