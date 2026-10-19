(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CalcEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function CalcError(code) {
    this.code = code;
    this.message = code;
  }
  CalcError.prototype = Object.create(Error.prototype);

  function formatNumber(n) {
    if (typeof n !== "number" || !isFinite(n)) throw new CalcError("overflow");
    if (n === 0 || Object.is(n, -0)) return "0";
    const abs = Math.abs(n);
    let text;
    if (abs >= 1e16 || abs < 1e-9) {
      text = n.toExponential(8);
    } else {
      text = Number(n.toPrecision(12)).toString();
      if (text.indexOf("e") !== -1) text = n.toExponential(8);
    }
    text = text
      .replace(/(\.\d*?)0+e/, "$1e")
      .replace(/\.e/, "e")
      .replace(/e\+/, "e+");
    return text;
  }

  function toDisplay(internal) {
    return String(internal).replace(/\./g, ",");
  }

  function parseInternal(text) {
    const value = Number(String(text).replace(/,/g, "."));
    if (!isFinite(value)) throw new CalcError("syntax");
    return value;
  }

  function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) throw new CalcError("domain");
    if (n > 170) throw new CalcError("overflow");
    let result = 1;
    for (let i = 2; i <= n; i += 1) result *= i;
    return result;
  }

  function toRad(value, angle) {
    if (angle === "deg") return value * Math.PI / 180;
    if (angle === "grad") return value * Math.PI / 200;
    return value;
  }

  function fromRad(value, angle) {
    if (angle === "deg") return value * 180 / Math.PI;
    if (angle === "grad") return value * 200 / Math.PI;
    return value;
  }

  function functions(angle) {
    return {
      sin: function (x) { return Math.sin(toRad(x, angle)); },
      cos: function (x) { return Math.cos(toRad(x, angle)); },
      tan: function (x) { return Math.tan(toRad(x, angle)); },
      asin: function (x) { return fromRad(Math.asin(x), angle); },
      acos: function (x) { return fromRad(Math.acos(x), angle); },
      atan: function (x) { return fromRad(Math.atan(x), angle); },
      sinh: function (x) { return Math.sinh(x); },
      cosh: function (x) { return Math.cosh(x); },
      tanh: function (x) { return Math.tanh(x); },
      asinh: function (x) { return Math.asinh(x); },
      acosh: function (x) { return Math.acosh(x); },
      atanh: function (x) { return Math.atanh(x); },
      sec: function (x) { return 1 / Math.cos(toRad(x, angle)); },
      csc: function (x) { return 1 / Math.sin(toRad(x, angle)); },
      cot: function (x) { return 1 / Math.tan(toRad(x, angle)); },
      asec: function (x) { return fromRad(Math.acos(1 / x), angle); },
      acsc: function (x) { return fromRad(Math.asin(1 / x), angle); },
      acot: function (x) { return fromRad(Math.atan(1 / x), angle); },
      sech: function (x) { return 1 / Math.cosh(x); },
      csch: function (x) { return 1 / Math.sinh(x); },
      coth: function (x) { return 1 / Math.tanh(x); },
      asech: function (x) { return Math.acosh(1 / x); },
      acsch: function (x) { return Math.asinh(1 / x); },
      acoth: function (x) { return Math.atanh(1 / x); },
      ln: function (x) { return Math.log(x); },
      log: function (x) { return Math.log(x) / Math.LN10; },
      exp: function (x) { return Math.exp(x); },
      exp10: function (x) { return Math.pow(10, x); },
      sqrt: function (x) {
        if (x < 0) throw new CalcError("domain");
        return Math.sqrt(x);
      },
      cbrt: function (x) { return Math.cbrt(x); },
      sqr: function (x) { return x * x; },
      cube: function (x) { return x * x * x; },
      abs: function (x) { return Math.abs(x); },
      recip: function (x) {
        if (x === 0) throw new CalcError("div0");
        return 1 / x;
      },
      fact: function (x) { return factorial(x); },
    };
  }

  function tokenize(source) {
    const text = String(source).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".");
    const tokens = [];
    let i = 0;
    while (i < text.length) {
      const ch = text.charAt(i);
      if (ch === " " || ch === "\t") {
        i += 1;
        continue;
      }
      if (/[0-9.]/.test(ch)) {
        let j = i + 1;
        while (j < text.length && /[0-9.]/.test(text.charAt(j))) j += 1;
        if (text.charAt(j) === "e" || text.charAt(j) === "E") {
          let k = j + 1;
          if (text.charAt(k) === "+" || text.charAt(k) === "-") k += 1;
          const start = k;
          while (k < text.length && /[0-9]/.test(text.charAt(k))) k += 1;
          if (k > start) j = k;
        }
        tokens.push({ type: "num", value: text.slice(i, j) });
        i = j;
        continue;
      }
      if (/[A-Za-zπ]/.test(ch)) {
        if (ch === "π") {
          tokens.push({ type: "id", value: "pi" });
          i += 1;
          continue;
        }
        let j = i + 1;
        while (j < text.length && /[A-Za-z0-9_]/.test(text.charAt(j))) j += 1;
        tokens.push({ type: "id", value: text.slice(i, j) });
        i = j;
        continue;
      }
      if ("+-*/^%!()".indexOf(ch) !== -1) {
        tokens.push({ type: "op", value: ch });
        i += 1;
        continue;
      }
      throw new CalcError("syntax");
    }
    return tokens;
  }

  function evaluateExpression(source, options) {
    const settings = options || {};
    const angle = settings.angle || "deg";
    const vars = settings.vars || {};
    const fns = functions(angle);
    const tokens = tokenize(source);
    let index = 0;

    function peek() {
      return tokens[index];
    }

    function eat() {
      const token = tokens[index];
      index += 1;
      return token;
    }

    function parseExpression() {
      return parseAdd();
    }

    function parseAdd() {
      let left = parseMul();
      while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        const op = eat().value;
        const right = parseMul();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }

    function parseMul() {
      let left = parsePow();
      while (peek() && ((peek().type === "op" && (peek().value === "*" || peek().value === "/")) || (peek().type === "id" && peek().value === "mod"))) {
        const token = eat();
        const right = parsePow();
        if (token.value === "*") left *= right;
        else if (token.value === "/") {
          if (right === 0) throw new CalcError("div0");
          left /= right;
        } else {
          if (right === 0) throw new CalcError("div0");
          left %= right;
        }
      }
      return left;
    }

    function parsePow() {
      const left = parseUnary();
      const next = peek();
      if (next && ((next.type === "op" && next.value === "^") || (next.type === "id" && next.value === "yroot"))) {
        const token = eat();
        const right = parsePow();
        if (token.value === "yroot") {
          if (left === 0) throw new CalcError("div0");
          return Math.pow(right, 1 / left);
        }
        return Math.pow(left, right);
      }
      return left;
    }

    function parseUnary() {
      if (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        const op = eat().value;
        const value = parseUnary();
        return op === "-" ? -value : value;
      }
      return parsePostfix();
    }

    function parsePostfix() {
      let value = parsePrimary();
      while (peek() && peek().type === "op" && (peek().value === "!" || peek().value === "%")) {
        const op = eat().value;
        if (op === "!") value = factorial(value);
        else value /= 100;
      }
      return value;
    }

    function parsePrimary() {
      const token = peek();
      if (!token) throw new CalcError("syntax");
      if (token.type === "num") {
        eat();
        const value = Number(token.value);
        if (!isFinite(value)) throw new CalcError("syntax");
        return value;
      }
      if (token.type === "op" && token.value === "(") {
        eat();
        const value = parseExpression();
        if (!peek() || peek().value !== ")") throw new CalcError("syntax");
        eat();
        return value;
      }
      if (token.type === "id") {
        eat();
        if (peek() && peek().type === "op" && peek().value === "(") {
          const fn = fns[token.value];
          if (!fn) throw new CalcError("syntax");
          eat();
          const arg = parseExpression();
          if (!peek() || peek().value !== ")") throw new CalcError("syntax");
          eat();
          const value = fn(arg);
          if (typeof value !== "number" || !isFinite(value)) throw new CalcError("domain");
          return value;
        }
        if (token.value === "pi" || token.value === "π") return Math.PI;
        if (token.value === "e") return Math.E;
        if (Object.prototype.hasOwnProperty.call(vars, token.value)) return vars[token.value];
        throw new CalcError("syntax");
      }
      throw new CalcError("syntax");
    }

    if (tokens.length === 0) throw new CalcError("syntax");
    const value = parseExpression();
    if (index !== tokens.length) throw new CalcError("syntax");
    if (!isFinite(value)) throw new CalcError("domain");
    return value;
  }

  function applyBinary(op, left, right) {
    if (op === "+") return left + right;
    if (op === "-") return left - right;
    if (op === "*") return left * right;
    if (op === "/") {
      if (right === 0) throw new CalcError("div0");
      return left / right;
    }
    throw new CalcError("syntax");
  }

  function unaryValue(kind, value) {
    if (kind === "sqrt") {
      if (value < 0) throw new CalcError("domain");
      return Math.sqrt(value);
    }
    if (kind === "sqr") return value * value;
    if (kind === "recip") {
      if (value === 0) throw new CalcError("div0");
      return 1 / value;
    }
    throw new CalcError("syntax");
  }

  function StandardCalculator() {
    this.clearAll();
  }

  StandardCalculator.prototype.snapshot = function () {
    return {
      display: toDisplay(this.display),
      expression: this.expression.replace(/\./g, ","),
      error: this.error,
    };
  };

  StandardCalculator.prototype.clearAll = function () {
    this.display = "0";
    this.expression = "";
    this.accumulator = null;
    this.operator = null;
    this.overwrite = true;
    this.lastOperator = null;
    this.lastOperand = null;
    this.error = null;
  };

  StandardCalculator.prototype.clearEntry = function () {
    this.display = "0";
    this.overwrite = true;
    this.error = null;
  };

  StandardCalculator.prototype.fail = function (error) {
    this.error = error.code;
    this.display = "0";
    this.expression = "";
    this.accumulator = null;
    this.operator = null;
    this.overwrite = true;
  };

  StandardCalculator.prototype.current = function () {
    return parseInternal(this.display);
  };

  StandardCalculator.prototype.show = function (value) {
    this.display = formatNumber(value);
    this.overwrite = true;
  };

  StandardCalculator.prototype.inputDigit = function (digit) {
    if (this.error) this.clearAll();
    if (this.overwrite) {
      this.display = digit === "." ? "0." : String(digit);
      this.overwrite = false;
      return;
    }
    if (digit === "." && this.display.indexOf(".") !== -1) return;
    const bare = this.display.replace("-", "").replace(".", "");
    if (bare.length >= 16) return;
    if (this.display === "0" && digit !== ".") this.display = String(digit);
    else if (this.display === "-0" && digit !== ".") this.display = "-" + digit;
    else this.display += digit;
  };

  StandardCalculator.prototype.backspace = function () {
    if (this.error) {
      this.clearAll();
      return;
    }
    if (this.overwrite) return;
    if (this.display.length <= 1 || (this.display.length === 2 && this.display.charAt(0) === "-")) {
      this.display = "0";
      this.overwrite = true;
      return;
    }
    this.display = this.display.slice(0, -1);
    if (this.display === "-" || this.display === "") this.display = "0";
  };

  StandardCalculator.prototype.negate = function () {
    if (this.error) return;
    if (this.display.charAt(0) === "-") this.display = this.display.slice(1);
    else if (this.display !== "0") this.display = "-" + this.display;
    this.overwrite = false;
  };

  StandardCalculator.prototype.percent = function () {
    if (this.error) return;
    try {
      const entry = this.current();
      let result = 0;
      if (this.operator === "+" || this.operator === "-") result = this.accumulator * entry / 100;
      else if (this.operator === "*" || this.operator === "/") result = entry / 100;
      this.show(result);
    } catch (error) {
      this.fail(error instanceof CalcError ? error : new CalcError("domain"));
    }
  };

  StandardCalculator.prototype.unary = function (kind) {
    if (this.error) return;
    try {
      const result = unaryValue(kind, this.current());
      this.show(result);
    } catch (error) {
      this.fail(error instanceof CalcError ? error : new CalcError("domain"));
    }
  };

  StandardCalculator.prototype.operate = function (op) {
    if (this.error) return;
    try {
      const entry = this.current();
      if (this.accumulator !== null && this.operator && !this.overwrite) {
        this.accumulator = applyBinary(this.operator, this.accumulator, entry);
        this.display = formatNumber(this.accumulator);
      } else {
        this.accumulator = entry;
      }
      this.operator = op;
      this.lastOperator = null;
      this.lastOperand = null;
      this.expression = formatNumber(this.accumulator) + " " + symbol(op);
      this.overwrite = true;
    } catch (error) {
      this.fail(error instanceof CalcError ? error : new CalcError("domain"));
    }
  };

  StandardCalculator.prototype.equals = function () {
    if (this.error) return null;
    try {
      let result;
      let expression;
      if (this.operator) {
        const operand = this.overwrite && this.lastOperand !== null ? this.lastOperand : this.current();
        result = applyBinary(this.operator, this.accumulator, operand);
        expression = formatNumber(this.accumulator) + " " + symbol(this.operator) + " " + formatNumber(operand) + " =";
        this.lastOperator = this.operator;
        this.lastOperand = operand;
        this.operator = null;
        this.accumulator = null;
      } else if (this.lastOperator && this.lastOperand !== null) {
        const left = this.current();
        result = applyBinary(this.lastOperator, left, this.lastOperand);
        expression = formatNumber(left) + " " + symbol(this.lastOperator) + " " + formatNumber(this.lastOperand) + " =";
      } else {
        return null;
      }
      this.expression = expression;
      this.show(result);
      return { expression: toDisplay(expression), value: result, display: toDisplay(this.display) };
    } catch (error) {
      this.fail(error instanceof CalcError ? error : new CalcError("domain"));
      return null;
    }
  };

  StandardCalculator.prototype.setDisplay = function (value) {
    this.error = null;
    this.show(typeof value === "number" ? value : parseInternal(value));
    this.expression = "";
    this.accumulator = null;
    this.operator = null;
  };

  StandardCalculator.prototype.getValue = function () {
    return this.error ? null : this.current();
  };

  function symbol(op) {
    if (op === "*") return "×";
    if (op === "/") return "÷";
    if (op === "-") return "−";
    return op;
  }

  function ScientificCalculator() {
    this.clearAll();
  }

  ScientificCalculator.prototype.clearAll = function () {
    this.tokens = [];
    this.entry = null;
    this.shown = "0";
    this.angle = "deg";
    this.done = false;
    this.lastSource = "";
    this.error = null;
  };

  ScientificCalculator.prototype.snapshot = function () {
    return {
      display: this.error ? this.errorText() : toDisplay(this.shown),
      expression: this.expressionText(),
      error: this.error,
      angle: this.angle,
    };
  };

  ScientificCalculator.prototype.errorText = function () {
    if (this.error === "div0") return "Division durch 0";
    if (this.error === "overflow") return "Überlauf";
    if (this.error === "domain") return "Ungültige Eingabe";
    return "Ungültige Eingabe";
  };

  ScientificCalculator.prototype.expressionText = function () {
    if (this.done) return toDisplay(this.lastSource) + " =";
    const parts = this.tokens.slice();
    if (this.entry !== null) parts.push(this.entry);
    return toDisplay(parts.join(" "));
  };

  ScientificCalculator.prototype.source = function () {
    const parts = this.tokens.slice();
    if (this.entry !== null) parts.push(this.entry);
    return parts.join(" ");
  };

  ScientificCalculator.prototype.inputDigit = function (digit) {
    if (this.error || this.done) {
      this.clearAll();
    }
    if (this.entry === null) this.entry = digit === "." ? "0." : String(digit);
    else {
      if (digit === "." && this.entry.indexOf(".") !== -1) return;
      const bare = this.entry.replace("-", "").replace(".", "");
      if (bare.length >= 16) return;
      if (this.entry === "0" && digit !== ".") this.entry = String(digit);
      else if (this.entry === "-0" && digit !== ".") this.entry = "-" + digit;
      else this.entry += digit;
    }
    this.shown = this.entry;
  };

  ScientificCalculator.prototype.backspace = function () {
    if (this.error) {
      this.clearAll();
      return;
    }
    if (this.done) return;
    if (this.entry === null) return;
    if (this.entry.length <= 1 || (this.entry.length === 2 && this.entry.charAt(0) === "-")) {
      this.entry = null;
      this.shown = "0";
      return;
    }
    this.entry = this.entry.slice(0, -1);
    this.shown = this.entry;
  };

  ScientificCalculator.prototype.clearEntry = function () {
    this.entry = null;
    this.shown = "0";
    this.error = null;
    this.done = false;
  };

  ScientificCalculator.prototype.negate = function () {
    if (this.error) return;
    if (this.done) {
      this.tokens = [this.shown];
      this.done = false;
      this.entry = null;
    }
    if (this.entry === null) {
      const value = this.shown === "0" ? 0 : parseInternal(this.shown);
      this.entry = formatNumber(-value);
    } else if (this.entry.charAt(0) === "-") this.entry = this.entry.slice(1) || "0";
    else this.entry = this.entry === "0" ? "0" : "-" + this.entry;
    this.shown = this.entry;
  };

  ScientificCalculator.prototype.commitEntry = function () {
    if (this.entry !== null) {
      this.tokens.push(this.entry);
      this.entry = null;
    }
  };

  ScientificCalculator.prototype.operate = function (op) {
    if (this.error) return;
    if (this.done) {
      this.tokens = [this.shown];
      this.entry = null;
      this.done = false;
    }
    this.commitEntry();
    if (this.tokens.length === 0) this.tokens.push("0");
    const last = this.tokens[this.tokens.length - 1];
    if (last === "+" || last === "-" || last === "*" || last === "/" || last === "^" || last === "yroot" || last === "mod") {
      this.tokens[this.tokens.length - 1] = op;
    } else {
      this.tokens.push(op);
    }
    this.shown = this.shown || "0";
  };

  ScientificCalculator.prototype.call = function (name) {
    if (this.error) return;
    if (this.done) {
      this.tokens = [];
      this.done = false;
    }
    let argText;
    if (this.entry !== null) {
      argText = this.entry;
      this.entry = null;
    } else if (this.tokens.length && /[0-9)]$/.test(this.tokens[this.tokens.length - 1])) {
      argText = this.tokens.pop();
    } else {
      argText = this.shown;
    }
    const atom = name + "(" + argText + ")";
    this.tokens.push(atom);
    try {
      const value = evaluateExpression(atom, { angle: this.angle });
      this.shown = formatNumber(value);
    } catch (error) {
      this.error = (error instanceof CalcError ? error : new CalcError("domain")).code;
      this.tokens = [];
      this.entry = null;
      this.shown = "0";
    }
  };

  ScientificCalculator.prototype.constant = function (name) {
    if (this.error || this.done) this.clearAll();
    this.commitEntry();
    this.tokens.push(name);
    this.shown = formatNumber(name === "pi" ? Math.PI : Math.E);
  };

  ScientificCalculator.prototype.parenthesis = function (which) {
    if (this.error) return;
    if (this.done) this.clearAll();
    if (which === "(") {
      this.commitEntry();
      this.tokens.push("(");
      return;
    }
    this.commitEntry();
    this.tokens.push(")");
  };

  ScientificCalculator.prototype.postfix = function (op) {
    if (this.error) return;
    if (this.done) {
      this.tokens = [this.shown];
      this.entry = null;
      this.done = false;
    }
    this.commitEntry();
    if (this.tokens.length === 0) this.tokens.push(this.shown);
    this.tokens.push(op);
    try {
      const last = this.tokens[this.tokens.length - 2] + op;
      this.shown = formatNumber(evaluateExpression(last, { angle: this.angle }));
    } catch (error) {
      this.error = (error instanceof CalcError ? error : new CalcError("domain")).code;
      this.tokens = [];
      this.entry = null;
      this.shown = "0";
    }
  };

  ScientificCalculator.prototype.equals = function () {
    if (this.error) return null;
    try {
      const source = this.source();
      if (!source) return null;
      const value = evaluateExpression(source, { angle: this.angle });
      const text = formatNumber(value);
      this.lastSource = source;
      this.tokens = [text];
      this.entry = null;
      this.shown = text;
      this.done = true;
      return { expression: toDisplay(source) + " =", value: value, display: toDisplay(text) };
    } catch (error) {
      this.error = (error instanceof CalcError ? error : new CalcError("domain")).code;
      this.tokens = [];
      this.entry = null;
      this.shown = "0";
      this.done = false;
      return null;
    }
  };

  ScientificCalculator.prototype.setDisplay = function (value) {
    this.clearAll();
    this.shown = formatNumber(typeof value === "number" ? value : parseInternal(value));
    this.tokens = [this.shown];
    this.done = true;
    this.lastSource = this.shown;
  };

  ScientificCalculator.prototype.getValue = function () {
    if (this.error) return null;
    try {
      return parseInternal(this.shown);
    } catch (error) {
      return null;
    }
  };

  function maskOf(width) {
    return (1n << BigInt(width)) - 1n;
  }

  function signedBits(bits, width) {
    const mask = maskOf(width);
    const value = bits & mask;
    const sign = 1n << BigInt(width - 1);
    return value >= sign ? value - (1n << BigInt(width)) : value;
  }

  function toBits(signed, width) {
    const span = 1n << BigInt(width);
    const mask = span - 1n;
    let value = signed % span;
    if (value < 0n) value += span;
    return value & mask;
  }

  function formatBits(bits, base, width) {
    const mask = maskOf(width);
    const value = bits & mask;
    if (base === 10) return signedBits(value, width).toString(10);
    return value.toString(base).toUpperCase();
  }

  function ProgrammerCalculator() {
    this.width = 64;
    this.base = 10;
    this.clearAll();
  }

  ProgrammerCalculator.prototype.clearAll = function () {
    this.bits = 0n;
    this.entry = "0";
    this.entryDirty = false;
    this.accumulator = null;
    this.operator = null;
    this.overwrite = true;
    this.expression = "";
    this.error = null;
    this.lastOperator = null;
    this.lastOperand = null;
  };

  ProgrammerCalculator.prototype.snapshot = function () {
    const active = this.entryDirty ? this.entry : formatBits(this.bits, this.base, this.width);
    return {
      display: this.error ? "Ungültige Eingabe" : active,
      expression: this.expression,
      error: this.error,
      base: this.base,
      width: this.width,
      bits: this.bits,
      rows: [16, 10, 8, 2].map((base) => ({
        base: base,
        text: formatBits(this.previewBits(), base, this.width),
        active: base === this.base,
      })),
    };
  };

  ProgrammerCalculator.prototype.previewBits = function () {
    if (!this.entryDirty) return this.bits;
    try {
      return this.parseEntry(this.entry);
    } catch (error) {
      return this.bits;
    }
  };

  ProgrammerCalculator.prototype.parseEntry = function (entry) {
    if (entry === "" || entry === "-") return 0n;
    if (this.base === 10) return toBits(BigInt(entry), this.width);
    const parsed = BigInt((this.base === 16 ? "0x" : this.base === 8 ? "0o" : "0b") + entry);
    return parsed & maskOf(this.width);
  };

  ProgrammerCalculator.prototype.commit = function () {
    if (this.entryDirty) {
      this.bits = this.parseEntry(this.entry);
      this.entryDirty = false;
      this.entry = formatBits(this.bits, this.base, this.width);
    }
  };

  ProgrammerCalculator.prototype.inputDigit = function (digit) {
    if (this.error) this.clearAll();
    const alphabet = "0123456789ABCDEF";
    const index = alphabet.indexOf(String(digit).toUpperCase());
    if (index < 0 || index >= this.base) return;
    const glyph = alphabet.charAt(index);
    if (this.overwrite || !this.entryDirty) {
      this.entry = glyph;
      this.overwrite = false;
      this.entryDirty = true;
    } else {
      if (this.entry === "0") this.entry = glyph;
      else if (this.entry.length >= this.width) return;
      else this.entry += glyph;
    }
    this.bits = this.parseEntry(this.entry);
  };

  ProgrammerCalculator.prototype.backspace = function () {
    if (this.error) {
      this.clearAll();
      return;
    }
    if (!this.entryDirty || this.overwrite) return;
    this.entry = this.entry.slice(0, -1);
    if (this.entry === "" || this.entry === "-") {
      this.entry = "0";
      this.overwrite = true;
    }
    this.bits = this.parseEntry(this.entry);
    this.entryDirty = true;
  };

  ProgrammerCalculator.prototype.clearEntry = function () {
    this.entry = "0";
    this.bits = 0n;
    this.entryDirty = false;
    this.overwrite = true;
    this.error = null;
  };

  ProgrammerCalculator.prototype.negate = function () {
    if (this.error) return;
    this.commit();
    this.bits = toBits(-signedBits(this.bits, this.width), this.width);
    this.entry = formatBits(this.bits, this.base, this.width);
    this.entryDirty = false;
    this.overwrite = true;
  };

  ProgrammerCalculator.prototype.not = function () {
    if (this.error) return;
    this.commit();
    this.bits = (~this.bits) & maskOf(this.width);
    this.entry = formatBits(this.bits, this.base, this.width);
    this.expression = "NOT(" + this.entry + ")";
    this.overwrite = true;
    this.entryDirty = false;
  };

  ProgrammerCalculator.prototype.setBase = function (base) {
    this.commit();
    this.base = base;
    this.entry = formatBits(this.bits, this.base, this.width);
    this.entryDirty = false;
    this.overwrite = true;
  };

  ProgrammerCalculator.prototype.setWidth = function (width) {
    this.commit();
    this.width = width;
    this.bits = this.bits & maskOf(width);
    this.entry = formatBits(this.bits, this.base, this.width);
    this.entryDirty = false;
    this.overwrite = true;
    if (this.accumulator !== null) this.accumulator = this.accumulator & maskOf(width);
  };

  ProgrammerCalculator.prototype.toggleBit = function (bit) {
    if (bit < 0 || bit >= this.width) return;
    this.commit();
    const flag = 1n << BigInt(bit);
    this.bits = (this.bits ^ flag) & maskOf(this.width);
    this.entry = formatBits(this.bits, this.base, this.width);
    this.entryDirty = false;
    this.overwrite = true;
    this.operator = null;
    this.accumulator = null;
    this.expression = "";
  };

  function progApply(op, left, right, width) {
    const mask = maskOf(width);
    const a = left & mask;
    const b = right & mask;
    if (op === "+") return (a + b) & mask;
    if (op === "-") return (a - b) & mask;
    if (op === "*") return (a * b) & mask;
    if (op === "/") {
      if (signedBits(b, width) === 0n) throw new CalcError("div0");
      return toBits(signedBits(a, width) / signedBits(b, width), width);
    }
    if (op === "mod") {
      if (signedBits(b, width) === 0n) throw new CalcError("div0");
      return toBits(signedBits(a, width) % signedBits(b, width), width);
    }
    if (op === "and") return a & b;
    if (op === "or") return a | b;
    if (op === "xor") return a ^ b;
    if (op === "nand") return (~(a & b)) & mask;
    if (op === "nor") return (~(a | b)) & mask;
    const amount = signedBits(b, width);
    if (op === "lsh") {
      if (amount <= 0n) return a;
      if (amount >= BigInt(width)) return 0n;
      return (a << amount) & mask;
    }
    if (op === "rsh") {
      if (amount <= 0n) return a;
      if (amount >= BigInt(width)) return 0n;
      return a >> amount;
    }
    if (op === "rol" || op === "ror") {
      const w = BigInt(width);
      let n = amount % w;
      if (n < 0n) n += w;
      if (op === "ror") n = (w - n) % w;
      if (n === 0n) return a;
      return ((a << n) | (a >> (w - n))) & mask;
    }
    throw new CalcError("syntax");
  }

  ProgrammerCalculator.prototype.operate = function (op) {
    if (this.error) return;
    try {
      this.commit();
      if (this.accumulator !== null && this.operator && !this.overwrite) {
        this.bits = progApply(this.operator, this.accumulator, this.bits, this.width);
      }
      this.accumulator = this.bits;
      this.operator = op;
      this.expression = formatBits(this.bits, this.base, this.width) + " " + op.toUpperCase();
      this.overwrite = true;
      this.entryDirty = false;
      this.entry = formatBits(this.bits, this.base, this.width);
    } catch (error) {
      this.error = "div0";
    }
  };

  ProgrammerCalculator.prototype.equals = function () {
    if (this.error || this.operator === null || this.accumulator === null) return null;
    try {
      this.commit();
      const operand = this.bits;
      const result = progApply(this.operator, this.accumulator, operand, this.width);
      const expression = formatBits(this.accumulator, this.base, this.width) + " " + this.operator.toUpperCase() + " " + formatBits(operand, this.base, this.width) + " =";
      this.bits = result;
      this.entry = formatBits(result, this.base, this.width);
      this.expression = expression;
      this.operator = null;
      this.accumulator = null;
      this.overwrite = true;
      this.entryDirty = false;
      return { expression: expression, value: signedBits(result, this.width).toString(), display: this.entry };
    } catch (error) {
      this.error = "div0";
      return null;
    }
  };

  ProgrammerCalculator.prototype.setDisplay = function (value) {
    let numeric;
    if (typeof value === "bigint") numeric = value;
    else if (typeof value === "string" && /^-?\d+$/.test(value.trim())) numeric = BigInt(value.trim());
    else numeric = BigInt(Math.trunc(Number(value)));
    this.error = null;
    this.bits = toBits(numeric, this.width);
    this.entry = formatBits(this.bits, this.base, this.width);
    this.entryDirty = false;
    this.overwrite = true;
    this.operator = null;
    this.accumulator = null;
    this.expression = "";
  };

  ProgrammerCalculator.prototype.getValue = function () {
    if (this.error) return null;
    return signedBits(this.previewBits(), this.width);
  };

  function addMonthsClamped(date, months) {
    const day = date.getDate();
    const cursor = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    cursor.setDate(Math.min(day, daysInMonth));
    return cursor;
  }

  function diffYMD(startDate, endDate) {
    let sign = 1;
    let start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (end < start) {
      sign = -1;
      const swap = start;
      start = end;
      end = swap;
    }
    let totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (addMonthsClamped(start, totalMonths) > end) totalMonths -= 1;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths - years * 12;
    const anchor = addMonthsClamped(start, totalMonths);
    const days = Math.round((end - anchor) / 86400000);
    return { sign: sign, years: years, months: months, days: days };
  }

  function addDays(start, days) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    date.setDate(date.getDate() + days);
    return date;
  }

  function sampleFunction(source, angle, xMin, xMax, count) {
    const points = [];
    for (let i = 0; i <= count; i += 1) {
      const x = xMin + (xMax - xMin) * (i / count);
      try {
        const y = evaluateExpression(source, { angle: angle, vars: { x: x } });
        points.push({ x: x, y: y });
      } catch (error) {
        points.push({ x: x, y: null });
      }
    }
    return points;
  }

  return {
    CalcError: CalcError,
    formatNumber: formatNumber,
    toDisplay: toDisplay,
    evaluateExpression: evaluateExpression,
    StandardCalculator: StandardCalculator,
    ScientificCalculator: ScientificCalculator,
    ProgrammerCalculator: ProgrammerCalculator,
    diffYMD: diffYMD,
    addDays: addDays,
    sampleFunction: sampleFunction,
    formatBits: formatBits,
    signedBits: signedBits,
  };
});
