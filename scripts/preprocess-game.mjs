import { readFileSync, writeFileSync } from "node:fs";

const [sourcePath, outputPath] = process.argv.slice(2);
if (!sourcePath || !outputPath) throw new Error("Usage: preprocess-game.mjs <source.ino> <output.cpp>");

const source = readFileSync(sourcePath, "utf8");
const definitions = [...source.matchAll(/^([A-Za-z_][A-Za-z0-9_ <>*&]*\([^;\n]*\))\s*\{/gm)]
  .map((match) => `${match[1].trim()};`)
  .filter((signature) => !signature.startsWith("void setup(") && !signature.startsWith("void loop("));
const insertion = source.indexOf("void setup()");
if (insertion < 0) throw new Error(`No setup() found in ${sourcePath}`);

const generated = `${source.slice(0, insertion)}// Prototypes generated to match Arduino's sketch preprocessing.\n${definitions.join("\n")}\n\n${source.slice(insertion)}`;
writeFileSync(outputPath, generated);
