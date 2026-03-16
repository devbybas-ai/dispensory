import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

// === SECURITY TEST SUITE ===
// Required by Part II, Section J.3

const EXCLUDED_DIRS = ["node_modules", ".next", "out", "build", "coverage", "generated", "test"];

function getAllSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (EXCLUDED_DIRS.includes(item.name)) continue;
      results.push(...getAllSourceFiles(fullPath, extensions));
    } else if (extensions.some((ext) => item.name.endsWith(ext))) {
      if (item.name.includes(".test.") || item.name.includes(".spec.")) continue;
      results.push(fullPath);
    }
  }
  return results;
}

const SRC_DIR = path.resolve(__dirname, "..");

describe("Security: Prohibited Patterns (Part II, Section B.11)", () => {
  const sourceFiles = getAllSourceFiles(SRC_DIR, [".ts", ".tsx"]);

  it("should have source files to scan", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("should not contain eval() calls", () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const hasEval = /\beval\s*\(/.test(content);
      expect(hasEval, `eval() found in ${file}`).toBe(false);
    }
  });

  it("should not contain new Function() calls", () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const hasNewFunction = /new\s+Function\s*\(/.test(content);
      expect(hasNewFunction, `new Function() found in ${file}`).toBe(false);
    }
  });

  it("should not contain document.write calls", () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const hasDocWrite = /document\.write\s*\(/.test(content);
      expect(hasDocWrite, `document.write() found in ${file}`).toBe(false);
    }
  });

  it("should not contain .innerHTML assignments", () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const hasInnerHTML = /\.innerHTML\s*=/.test(content);
      expect(hasInnerHTML, `.innerHTML assignment found in ${file}`).toBe(false);
    }
  });

  it("should not contain console.log in API routes", () => {
    const apiFiles = sourceFiles.filter((f) => f.includes(path.join("app", "api")));
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const hasConsoleLog = /console\.log\s*\(/.test(content);
      expect(hasConsoleLog, `console.log found in API route ${file}`).toBe(false);
    }
  });

  it("should not expose server-side env vars in client components", () => {
    for (const file of sourceFiles) {
      if (!file.endsWith(".tsx")) continue;
      const content = fs.readFileSync(file, "utf-8");
      if (!content.includes('"use client"') && !content.includes("'use client'")) continue;

      const hasServerEnv = /process\.env\.(?!NEXT_PUBLIC_)\w+/.test(content);
      expect(hasServerEnv, `Server env var accessed in client component ${file}`).toBe(false);
    }
  });

  it("should not contain hardcoded secrets patterns", () => {
    const secretPatterns = [
      /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']{10,}["']/i,
      /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']{4,}["']/i,
      /(?:secret|token)\s*[:=]\s*["'][^"']{10,}["']/i,
    ];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      for (const pattern of secretPatterns) {
        const hasSecret = pattern.test(content);
        expect(hasSecret, `Potential hardcoded secret in ${file}`).toBe(false);
      }
    }
  });
});

describe("Security: Code Quality Patterns", () => {
  const sourceFiles = getAllSourceFiles(SRC_DIR, [".ts", ".tsx"]);

  it("should not contain @ts-ignore without justification", () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line && /@ts-ignore/.test(line)) {
          const commentIdx = line.indexOf("//");
          const ignoreIdx = line.indexOf("@ts-ignore");
          const hasJustification = commentIdx >= 0 && commentIdx < ignoreIdx;
          expect(!hasJustification, `@ts-ignore without justification at ${file}:${i + 1}`).toBe(
            false
          );
        }
      }
    }
  });

  it("should not contain blanket eslint-disable comments", () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const hasBlanketDisable =
          /eslint-disable\s*\*\//.test(line) || /\/\/\s*eslint-disable(?!\s*-next-line)/.test(line);
        expect(hasBlanketDisable, `Blanket eslint-disable at ${file}:${i + 1}`).toBe(false);
      }
    }
  });
});
