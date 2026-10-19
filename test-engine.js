const assert = require("assert");
const engine = require("./js/engine.js");
const units = require("./js/units.js");

function press(calc, digits) {
  for (const digit of digits) calc.inputDigit(digit);
}

const standard = new engine.StandardCalculator();
press(standard, "2");
standard.operate("+");
press(standard, "3");
standard.operate("*");
press(standard, "4");
const chained = standard.equals();
assert.strictEqual(chained.display, "20");

const percent = new engine.StandardCalculator();
press(percent, "200");
percent.operate("+");
press(percent, "10");
percent.percent();
assert.strictEqual(percent.equals().display, "220");

const percentMul = new engine.StandardCalculator();
press(percentMul, "50");
percentMul.operate("*");
press(percentMul, "10");
percentMul.percent();
assert.strictEqual(percentMul.equals().display, "5");

const repeat = new engine.StandardCalculator();
press(repeat, "2");
repeat.operate("+");
press(repeat, "3");
assert.strictEqual(repeat.equals().display, "5");
assert.strictEqual(repeat.equals().display, "8");

const div0 = new engine.StandardCalculator();
press(div0, "1");
div0.operate("/");
press(div0, "0");
assert.strictEqual(div0.equals(), null);
assert.strictEqual(div0.snapshot().error, "div0");

const scientific = new engine.ScientificCalculator();
press(scientific, "2");
scientific.operate("+");
press(scientific, "3");
scientific.operate("*");
press(scientific, "4");
assert.strictEqual(scientific.equals().display, "14");

const sine = new engine.ScientificCalculator();
press(sine, "30");
sine.call("sin");
assert.strictEqual(sine.snapshot().display, "0,5");
sine.equals();
assert.strictEqual(sine.snapshot().error, null);

const power = new engine.ScientificCalculator();
press(power, "2");
power.operate("^");
press(power, "10");
assert.strictEqual(power.equals().display, "1024");

const root = new engine.ScientificCalculator();
press(root, "3");
root.operate("yroot");
press(root, "8");
assert.strictEqual(root.equals().display, "2");

assert.strictEqual(engine.evaluateExpression("sqrt(9)"), 3);
assert.throws(() => engine.evaluateExpression("1/0"), (error) => error.code === "div0");

const programmer = new engine.ProgrammerCalculator();
programmer.setBase(16);
programmer.inputDigit("F");
programmer.inputDigit("F");
programmer.operate("and");
programmer.inputDigit("F");
const masked = programmer.equals();
assert.strictEqual(masked.display, "F");
const zeroed = new engine.ProgrammerCalculator();
zeroed.not();
assert.strictEqual(zeroed.snapshot().rows.find((row) => row.base === 10).text, "-1");
assert.strictEqual(zeroed.snapshot().rows.find((row) => row.base === 16).text, "FFFFFFFFFFFFFFFF");

assert.strictEqual(units.convert("length", "Kilometer", "Meter", 1), 1000);
assert.strictEqual(units.convert("temperature", "DegreesCelsius", "DegreesFahrenheit", 0), 32);
assert.ok(Math.abs(units.convert("temperature", "DegreesCelsius", "Kelvin", 0) - 273.15) < 1e-9);
assert.strictEqual(units.convert("data", "Byte", "Bit", 1), 8);
assert.strictEqual(units.category("angle").units.map((unit) => unit.id).join(","), "Degree,Radian,Gradian");

const from = new Date(2024, 0, 31);
const to = new Date(2024, 2, 1);
const diff = engine.diffYMD(from, to);
assert.deepStrictEqual({ years: diff.years, months: diff.months, days: diff.days, sign: diff.sign }, { years: 0, months: 1, days: 1, sign: 1 });
assert.strictEqual(engine.addDays(from, 1).getDate(), 1);

const points = engine.sampleFunction("x^2", "deg", 0, 2, 2);
assert.strictEqual(points[0].y, 0);
assert.strictEqual(points[2].y, 4);

console.log("engine tests passed");
