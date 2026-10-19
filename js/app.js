(function () {
  const engine = window.CalcEngine;
  const unitsApi = window.CalcUnits;
  const standard = new engine.StandardCalculator();
  const scientific = new engine.ScientificCalculator();
  const programmer = new engine.ProgrammerCalculator();
  const memory = [];
  const history = [];

  const state = {
    mode: "standard",
    panel: "keys",
    menu: false,
    second: false,
    hyp: false,
    converterCategory: "length",
    fromUnit: "Meter",
    toUnit: "Kilometer",
    left: "0",
    right: "0",
    activeSide: "left",
    dateMode: "diff",
    dateFrom: iso(new Date()),
    dateTo: iso(new Date()),
    dateDays: "7",
    dateSign: "+",
    graph: {
      equations: [{ text: "x^2", color: "#60cdff" }],
      xMin: -10,
      xMax: 10,
      yMin: -6,
      yMax: 20,
      angle: "deg",
    },
  };

  const calcModes = [
    ["standard", "Standard"],
    ["scientific", "Wissenschaftlich"],
    ["graphing", "Diagramm"],
    ["programmer", "Programmierer"],
    ["date", "Datumsberechnung"],
  ];
  const converterModes = unitsApi.categories.map(function (category) {
    return [category.id, category.name];
  });

  const root = document.getElementById("app");

  function iso(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function parseIso(value) {
    const parts = value.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function errorLabel(code) {
    if (!code) return "";
    if (code === "div0") return "Division durch 0";
    if (code === "overflow") return "Überlauf";
    return "Ungültige Eingabe";
  }

  function activeCalc() {
    if (state.mode === "scientific") return scientific;
    if (state.mode === "programmer") return programmer;
    return standard;
  }

  function isCalculatorMode() {
    return state.mode === "standard" || state.mode === "scientific" || state.mode === "programmer";
  }

  function title() {
    const found = calcModes.concat(converterModes).filter(function (item) { return item[0] === state.mode; })[0];
    return found ? found[1] : "Rechner";
  }

  function pushHistory(item) {
    if (!item) return;
    history.unshift(item);
    if (history.length > 100) history.pop();
  }

  function currentNumber() {
    const calc = activeCalc();
    const value = calc.getValue();
    return value === null ? null : value;
  }

  function memoryStore(value) {
    if (value === null || value === undefined) return;
    memory.unshift(value);
    if (memory.length > 100) memory.pop();
  }

  function recallMemory() {
    if (!memory.length) return;
    activeCalc().setDisplay(memory[0]);
    render();
  }

  function button(act, label, kind, extra) {
    const disabled = extra && extra.disabled ? " disabled" : "";
    const titleText = extra && extra.title ? " title=\"" + extra.title + "\"" : "";
    const on = extra && extra.on ? " on" : "";
    return "<button type=\"button\" class=\"key " + (kind || "num") + on + "\" data-act=\"" + act + "\"" + disabled + titleText + ">" + label + "</button>";
  }

  function standardPad() {
    const keys = [
      ["pct", "%", "fn"], ["ce", "CE", "fn"], ["c", "C", "fn"], ["bs", "⌫", "fn"],
      ["unary:recip", "1/x", "fn"], ["unary:sqr", "x²", "fn"], ["unary:sqrt", "√x", "fn"], ["op:/", "÷", "op"],
      ["d:7", "7", "num"], ["d:8", "8", "num"], ["d:9", "9", "num"], ["op:*", "×", "op"],
      ["d:4", "4", "num"], ["d:5", "5", "num"], ["d:6", "6", "num"], ["op:-", "−", "op"],
      ["d:1", "1", "num"], ["d:2", "2", "num"], ["d:3", "3", "num"], ["op:+", "+", "op"],
      ["neg", "±", "num"], ["d:0", "0", "num"], ["dot", ",", "num"], ["eq", "=", "eq"],
    ];
    return "<div class=\"pad standard\">" + keys.map(function (key) {
      return button(key[0], key[1], key[2]);
    }).join("") + "</div>";
  }

  function sciName(normal, inverse, hyperbolic, inverseHyperbolic) {
    if (state.hyp && state.second) return inverseHyperbolic;
    if (state.hyp) return hyperbolic;
    if (state.second) return inverse;
    return normal;
  }

  function scientificPad() {
    const angle = scientific.angle;
    const angles = ["deg", "rad", "grad"].map(function (value, index) {
      const label = ["DEG", "RAD", "GRAD"][index];
      return "<button type=\"button\" data-act=\"angle:" + value + "\" class=\"" + (angle === value ? "on" : "") + "\">" + label + "</button>";
    }).join("");
    const trig = sciName("sin", "asin", "sinh", "asinh");
    const trig2 = sciName("cos", "acos", "cosh", "acosh");
    const trig3 = sciName("tan", "atan", "tanh", "atanh");
    const sec = sciName("sec", "asec", "sech", "asech");
    const csc = sciName("csc", "acsc", "csch", "acsch");
    const cot = sciName("cot", "acot", "coth", "acoth");
    const keys = [
      button("toggle:second", "2ⁿᵈ", "fn", { on: state.second }),
      button("const:pi", "π", "fn"),
      button("const:e", "e", "fn"),
      button("fn:" + trig, sciName("sin", "sin⁻¹", "sinh", "sinh⁻¹"), "fn"),
      button("fn:" + trig2, sciName("cos", "cos⁻¹", "cosh", "cosh⁻¹"), "fn"),
      button("fn:" + trig3, sciName("tan", "tan⁻¹", "tanh", "tanh⁻¹"), "fn"),
      button(state.second ? "fn:exp" : "fn:ln", state.second ? "eˣ" : "ln", "fn"),
      button(state.second ? "fn:exp10" : "fn:log", state.second ? "10ˣ" : "log", "fn"),
      button(state.second ? "op:yroot" : "op:^", state.second ? "ʸ√x" : "xʸ", "fn"),
      button(state.second ? "fn:cube" : "fn:sqr", state.second ? "x³" : "x²", "fn"),
      button(state.second ? "fn:cbrt" : "fn:sqrt", state.second ? "³√x" : "√x", "fn"),
      button("fn:abs", "|x|", "fn"),
      button("fn:fact", "n!", "fn"),
      button("paren:(", "(", "fn"),
      button("paren:)", ")", "fn"),
      button("fn:" + sec, sciName("sec", "sec⁻¹", "sech", "sech⁻¹"), "fn"),
      button("fn:" + csc, sciName("csc", "csc⁻¹", "csch", "csch⁻¹"), "fn"),
      button("fn:" + cot, sciName("cot", "cot⁻¹", "coth", "coth⁻¹"), "fn"),
      button("toggle:hyp", "hyp", "fn", { on: state.hyp }),
      button("fn:recip", "1/x", "fn"),
      button("pct", "%", "fn"),
    ];
    return "<div class=\"sci-wrap\"><div class=\"angles\">" + angles + "</div><div class=\"pad sci\">" + keys.join("") + "</div></div>";
  }

  function programmerChrome() {
    const snap = programmer.snapshot();
    const widths = [64, 32, 16, 8].map(function (width) {
      const label = { 64: "QWORD", 32: "DWORD", 16: "WORD", 8: "BYTE" }[width];
      return "<button type=\"button\" data-act=\"width:" + width + "\" class=\"" + (programmer.width === width ? "on" : "") + "\">" + label + "</button>";
    }).join("");
    const names = { 16: "HEX", 10: "DEC", 8: "OCT", 2: "BIN" };
    const bases = snap.rows.map(function (row) {
      return "<button type=\"button\" class=\"base-row" + (row.active ? " on" : "") + "\" data-act=\"base:" + row.base + "\"><strong>" + names[row.base] + "</strong><span>" + row.text + "</span></button>";
    }).join("");
    let bits = "";
    const rowSize = programmer.width > 16 ? 16 : programmer.width;
    for (let start = programmer.width - 1; start >= 0; start -= rowSize) {
      let row = "<div class=\"bit-row\">";
      const end = Math.max(-1, start - rowSize);
      for (let bit = start; bit > end; bit -= 1) {
        if ((start - bit) % 4 === 0) row += "<span class=\"nibble\">";
        const on = ((programmer.previewBits() >> BigInt(bit)) & 1n) === 1n;
        row += "<button type=\"button\" class=\"bit" + (on ? " on" : "") + "\" data-act=\"bit:" + bit + "\" title=\"Bit " + bit + "\">" + (on ? "1" : "0") + "</button>";
        if ((start - bit) % 4 === 3 || bit === end + 1) row += "</span>";
      }
      row += "</div>";
      bits += row;
    }
    const base = programmer.base;
    function digit(label, value) {
      return button("d:" + label, label, "num", { disabled: value >= base });
    }
    const keys = [
      button("prog:lsh", "Lsh", "fn"), button("prog:rsh", "Rsh", "fn"), button("prog:rol", "RoL", "fn"), button("prog:ror", "RoR", "fn"),
      digit("A", 10), digit("B", 11), digit("C", 12), button("prog:and", "AND", "fn"),
      digit("D", 13), digit("E", 14), digit("F", 15), button("prog:or", "OR", "fn"),
      button("prog:not", "NOT", "fn"), button("prog:xor", "XOR", "fn"), button("prog:nand", "NAND", "fn"), button("prog:nor", "NOR", "fn"),
      digit("7", 7), digit("8", 8), digit("9", 9), button("op:/", "÷", "op"),
      digit("4", 4), digit("5", 5), digit("6", 6), button("op:*", "×", "op"),
      digit("1", 1), digit("2", 2), digit("3", 3), button("op:-", "−", "op"),
      button("neg", "±", "num"), digit("0", 0), button("prog:mod", "Mod", "fn"), button("op:+", "+", "op"),
      button("ce", "CE", "fn"), button("c", "C", "fn"), button("bs", "⌫", "fn"), button("eq", "=", "eq"),
    ];
    return "<div class=\"prog-wrap\"><div class=\"widths\">" + widths + "</div><div class=\"bases\">" + bases + "</div><div class=\"bits\">" + bits + "</div><div class=\"pad prog\">" + keys.join("") + "</div></div>";
  }

  function memoryRow() {
    const empty = memory.length === 0;
    return "<div class=\"memory-row\">" +
      "<button type=\"button\" class=\"mem-btn\" data-act=\"mc\"" + (empty ? " disabled" : "") + ">MC</button>" +
      "<button type=\"button\" class=\"mem-btn\" data-act=\"mr\"" + (empty ? " disabled" : "") + ">MR</button>" +
      "<button type=\"button\" class=\"mem-btn\" data-act=\"mplus\">M+</button>" +
      "<button type=\"button\" class=\"mem-btn\" data-act=\"mminus\">M−</button>" +
      "<button type=\"button\" class=\"mem-btn\" data-act=\"ms\">MS</button>" +
      "<button type=\"button\" class=\"mem-btn\" data-act=\"memory\" aria-label=\"Speicherliste\">⌃</button>" +
      "</div>";
  }

  function historyPanel() {
    const items = history.length ? history.map(function (item, index) {
      return "<button type=\"button\" class=\"history-item\" data-act=\"hist:" + index + "\"><small>" + escapeHtml(item.expression) + "</small><b>" + escapeHtml(item.display) + "</b></button>";
    }).join("") : "<p class=\"empty\">Es ist noch kein Verlauf vorhanden.</p>";
    return "<div class=\"list-panel\"><h2>Verlauf</h2>" + items + "</div>";
  }

  function memoryPanel() {
    const items = memory.length ? memory.map(function (value, index) {
      const text = typeof value === "bigint" ? value.toString() : engine.toDisplay(engine.formatNumber(Number(value)));
      return "<div class=\"memory-item\"><button type=\"button\" data-act=\"mrecall:" + index + "\"><b>" + escapeHtml(text) + "</b></button><div class=\"slot-actions\">" +
        "<button type=\"button\" data-act=\"mslotplus:" + index + "\">M+</button>" +
        "<button type=\"button\" data-act=\"mslotminus:" + index + "\">M−</button>" +
        "<button type=\"button\" data-act=\"mslotclear:" + index + "\">MC</button></div></div>";
    }).join("") : "<p class=\"empty\">Es wurde noch nichts im Speicher gespeichert.</p>";
    return "<div class=\"list-panel\"><h2>Speicher</h2>" + items + "</div>";
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function calculatorView() {
    const calc = activeCalc();
    const snap = calc.snapshot();
    const value = snap.error ? errorLabel(snap.error) : snap.display;
    let pads = "";
    if (state.panel === "history") pads = historyPanel();
    else if (state.panel === "memory") pads = memoryPanel();
    else if (state.mode === "scientific") pads = "<div class=\"pads\">" + scientificPad() + standardPad() + "</div>";
    else if (state.mode === "programmer") pads = "<div class=\"pads\">" + programmerChrome() + "</div>";
    else pads = "<div class=\"pads\">" + standardPad() + "</div>";
    return "<section class=\"display\"><div class=\"expr\" id=\"expr\">" + escapeHtml(snap.expression || "") + "</div><div class=\"value" + (snap.error ? " error" : "") + "\" id=\"value\">" + escapeHtml(value) + "</div></section>" +
      memoryRow() + "<div class=\"body\">" + pads + "</div>";
  }

  function dateView() {
    const from = parseIso(state.dateFrom);
    const to = parseIso(state.dateTo);
    let result = "";
    if (state.dateMode === "diff") {
      const diff = engine.diffYMD(from, to);
      const sign = diff.sign < 0 ? "−" : "";
      result = sign + diff.years + " Jahre, " + diff.months + " Monate, " + diff.days + " Tage";
    } else {
      const days = Number(state.dateDays);
      const delta = state.dateSign === "-" ? -days : days;
      const next = engine.addDays(from, Number.isFinite(days) ? delta : 0);
      result = next.toLocaleDateString("de-DE");
    }
    return "<div class=\"stack\"><div class=\"mode-switch\">" +
      "<button type=\"button\" data-act=\"datemode:diff\" class=\"" + (state.dateMode === "diff" ? "on" : "") + "\">Differenz</button>" +
      "<button type=\"button\" data-act=\"datemode:add\" class=\"" + (state.dateMode === "add" ? "on" : "") + "\">Addieren oder subtrahieren</button></div>" +
      "<div class=\"field\"><label>Von</label><input id=\"date-from\" type=\"date\" value=\"" + state.dateFrom + "\"></div>" +
      (state.dateMode === "diff"
        ? "<div class=\"field\"><label>Bis</label><input id=\"date-to\" type=\"date\" value=\"" + state.dateTo + "\"></div>"
        : "<div class=\"field\"><label>Tage</label><div class=\"mode-switch\"><button type=\"button\" data-act=\"datesign:+\" class=\"" + (state.dateSign === "+" ? "on" : "") + "\">+</button><button type=\"button\" data-act=\"datesign:-\" class=\"" + (state.dateSign === "-" ? "on" : "") + "\">−</button></div><input id=\"date-days\" type=\"number\" min=\"0\" step=\"1\" value=\"" + escapeHtml(state.dateDays) + "\"></div>") +
      "<div class=\"result-card\"><label>Ergebnis</label><b>" + escapeHtml(result) + "</b></div></div>";
  }

  function formatConverter(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    try { return engine.toDisplay(engine.formatNumber(value)); }
    catch (error) { return "—"; }
  }

  function syncConverter(edited) {
    const raw = String(state[edited]).replace(/\./g, "").replace(",", ".");
    const value = raw === "" || raw === "-" || raw === "." ? 0 : Number(raw);
    if (!isFinite(value)) return;
    const output = edited === "left"
      ? unitsApi.convert(state.converterCategory, state.fromUnit, state.toUnit, value)
      : unitsApi.convert(state.converterCategory, state.toUnit, state.fromUnit, value);
    state[edited === "left" ? "right" : "left"] = formatConverter(output);
  }

  function converterView() {
    const category = unitsApi.category(state.mode);
    const options = category.units.map(function (unit) {
      return "<option value=\"" + unit.id + "\">" + escapeHtml(unit.name) + " (" + escapeHtml(unit.abbr) + ")</option>";
    }).join("");
    const fromOptions = options.replace("value=\"" + state.fromUnit + "\"", "value=\"" + state.fromUnit + "\" selected");
    const toOptions = options.replace("value=\"" + state.toUnit + "\"", "value=\"" + state.toUnit + "\" selected");
    const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "±", "0", ","];
    return "<div class=\"stack\"><p class=\"fineprint\">" + escapeHtml(category.note || "Umrechnung über die Basiseinheit. Sondergrößen sind konventionelle Näherungen; die nativen ConversionData-Werte wurden nicht dekompiliert.") + "</p>" +
      "<div class=\"unit-row" + (state.activeSide === "left" ? " active" : "") + "\"><input id=\"conv-left\" data-side=\"left\" value=\"" + escapeHtml(state.left) + "\" inputmode=\"decimal\"><select id=\"conv-from\">" + fromOptions + "</select></div>" +
      "<div class=\"unit-row" + (state.activeSide === "right" ? " active" : "") + "\"><input id=\"conv-right\" data-side=\"right\" value=\"" + escapeHtml(state.right) + "\" inputmode=\"decimal\"><select id=\"conv-to\">" + toOptions + "</select></div>" +
      "<div class=\"pad standard\">" + keys.map(function (label) {
        const act = label === "±" ? "conv:neg" : label === "," ? "conv:dot" : "conv:" + label;
        return button(act, label, "num");
      }).join("") + button("conv:bs", "⌫", "fn") + button("conv:c", "C", "fn") + "</div></div>";
  }

  function graphView() {
    const rows = state.graph.equations.map(function (equation, index) {
      return "<div class=\"eq-row\"><span class=\"swatch\" style=\"background:" + equation.color + "\"></span><input data-eq=\"" + index + "\" value=\"" + escapeHtml(equation.text) + "\" aria-label=\"Gleichung " + (index + 1) + "\"><button type=\"button\" data-act=\"eqdel:" + index + "\" aria-label=\"Gleichung entfernen\">×</button></div>";
    }).join("");
    return "<div class=\"graph-layout\"><div class=\"equations\"><h2>y =</h2>" + rows +
      "<button type=\"button\" class=\"key fn\" data-act=\"eqadd\">Gleichung hinzufügen</button>" +
      "<div class=\"angles\">" + ["deg", "rad", "grad"].map(function (value, index) {
        return "<button type=\"button\" data-act=\"gangle:" + value + "\" class=\"" + (state.graph.angle === value ? "on" : "") + "\">" + ["DEG", "RAD", "GRAD"][index] + "</button>";
      }).join("") + "</div>" +
      "<div class=\"ranges\"><label>x min<input id=\"xmin\" type=\"number\" value=\"" + state.graph.xMin + "\"></label><label>x max<input id=\"xmax\" type=\"number\" value=\"" + state.graph.xMax + "\"></label><label>y min<input id=\"ymin\" type=\"number\" value=\"" + state.graph.yMin + "\"></label><label>y max<input id=\"ymax\" type=\"number\" value=\"" + state.graph.yMax + "\"></label></div>" +
      "<p class=\"fineprint\">Ziehen verschiebt die Ansicht, das Rad zoomt. Der Diagrammmodus des Originals nutzt GraphControl und WebView2; diese Ansicht zeichnet y=f(x) selbst.</p></div>" +
      "<div class=\"plot-wrap\"><canvas id=\"plot\"></canvas></div></div>";
  }

  function menuView() {
    function group(heading, items) {
      return "<h2>" + heading + "</h2>" + items.map(function (item) {
        return "<button type=\"button\" class=\"nav" + (state.mode === item[0] ? " on" : "") + "\" data-act=\"mode:" + item[0] + "\">" + item[1] + "</button>";
      }).join("");
    }
    return "<div class=\"menu\"><button type=\"button\" class=\"scrim\" data-act=\"closemenu\" aria-label=\"Menü schließen\"></button><div class=\"drawer\">" +
      "<div class=\"drawer-head\"><button type=\"button\" class=\"icon-btn\" data-act=\"closemenu\" aria-label=\"Menü schließen\">☰</button><span>Menü</span></div>" +
      "<div class=\"drawer-list\">" +
      group("Rechner", calcModes) + group("Konverter", converterModes) +
      "<p class=\"fineprint\">Nachbau von Microsoft.WindowsCalculator 11.2607.0.0. Beobachtet wurden die Modi, NavCategory, Speicher, Verlauf und Einheiten. Der native Rechenkern in CalcViewModel.dll hat keine lesbaren Methodenrümpfe in der WinMD-Datei, und Ghidra ist nicht konfiguriert.</p></div></div></div>";
  }

  function postHost(message) {
    if (window.chrome && window.chrome.webview) window.chrome.webview.postMessage(message);
  }

  function captionButtons() {
    return "<span class=\"caption\">" +
      "<button type=\"button\" class=\"icon-btn cap\" data-act=\"win:min\" aria-label=\"Minimieren\">&#xE921;</button>" +
      "<button type=\"button\" class=\"icon-btn cap\" data-act=\"win:max\" aria-label=\"Maximieren\">&#xE922;</button>" +
      "<button type=\"button\" class=\"icon-btn cap close\" data-act=\"win:close\" aria-label=\"Schließen\">&#xE8BB;</button></span>";
  }

  function render() {
    const wide = state.mode === "scientific" || state.mode === "programmer" || unitsApi.category(state.mode);
    const graph = state.mode === "graphing";
    root.className = "app" + (graph ? " graph" : wide ? " wide" : "");
    let main = "";
    if (isCalculatorMode()) main = calculatorView();
    else if (state.mode === "date") main = dateView();
    else if (state.mode === "graphing") main = graphView();
    else main = converterView();
    const menuLabel = state.menu ? "Menü schließen" : "Menü";
    root.innerHTML = "<header class=\"top\"><button type=\"button\" class=\"icon-btn\" data-act=\"menu\" aria-label=\"" + menuLabel + "\">☰</button><h1>" + escapeHtml(title()) + "</h1>" +
      "<div class=\"top-actions\">" +
      (isCalculatorMode() ? "<button type=\"button\" class=\"icon-btn\" data-act=\"history\" aria-label=\"Verlauf\">⏱</button>" : "") +
      captionButtons() + "</div></header><div class=\"stage\">" + main + (state.menu ? menuView() : "") + "</div>";
    fitValue();
    if (state.mode === "graphing") drawGraph();
  }

  function fitValue() {
    const node = document.getElementById("value");
    if (!node) return;
    let size = 46;
    node.style.fontSize = size + "px";
    const parent = node.parentElement;
    while (node.scrollWidth > parent.clientWidth - 8 && size > 18) {
      size -= 2;
      node.style.fontSize = size + "px";
    }
  }

  function drawGraph() {
    const canvas = document.getElementById("plot");
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = rect.width;
    const height = rect.height;
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, width, height);
    const xSpan = state.graph.xMax - state.graph.xMin || 1;
    const ySpan = state.graph.yMax - state.graph.yMin || 1;
    const X = function (x) { return (x - state.graph.xMin) / xSpan * width; };
    const Y = function (y) { return height - (y - state.graph.yMin) / ySpan * height; };
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let tick = Math.ceil(state.graph.xMin); tick <= state.graph.xMax; tick += 1) {
      ctx.moveTo(X(tick), 0);
      ctx.lineTo(X(tick), height);
    }
    for (let tick = Math.ceil(state.graph.yMin); tick <= state.graph.yMax; tick += 1) {
      ctx.moveTo(0, Y(tick));
      ctx.lineTo(width, Y(tick));
    }
    ctx.stroke();
    ctx.strokeStyle = "#8a8a8a";
    ctx.beginPath();
    if (state.graph.yMin < 0 && state.graph.yMax > 0) {
      ctx.moveTo(0, Y(0));
      ctx.lineTo(width, Y(0));
    }
    if (state.graph.xMin < 0 && state.graph.xMax > 0) {
      ctx.moveTo(X(0), 0);
      ctx.lineTo(X(0), height);
    }
    ctx.stroke();
    state.graph.equations.forEach(function (equation) {
      if (!equation.text.trim()) return;
      const points = engine.sampleFunction(equation.text, state.graph.angle, state.graph.xMin, state.graph.xMax, Math.max(240, Math.floor(width)));
      ctx.beginPath();
      ctx.strokeStyle = equation.color;
      ctx.lineWidth = 2;
      let drawing = false;
      let previous = null;
      points.forEach(function (point) {
        if (point.y === null || !isFinite(point.y)) {
          drawing = false;
          previous = null;
          return;
        }
        if (previous && Math.abs(point.y - previous.y) > ySpan * 4) drawing = false;
        const px = X(point.x);
        const py = Y(point.y);
        if (!drawing) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        drawing = true;
        previous = point;
      });
      ctx.stroke();
    });
  }

  function handleCalculator(act) {
    const calc = activeCalc();
    const scientificMode = state.mode === "scientific";
    const programmerMode = state.mode === "programmer";
    if (act.indexOf("d:") === 0) {
      const digit = act.slice(2);
      if (programmerMode) programmer.inputDigit(digit);
      else if (scientificMode) scientific.inputDigit(digit);
      else standard.inputDigit(digit);
      return;
    }
    if (act === "dot") {
      if (scientificMode) scientific.inputDigit(".");
      else if (!programmerMode) standard.inputDigit(".");
      return;
    }
    if (act === "bs") return (programmerMode ? programmer : scientificMode ? scientific : standard).backspace();
    if (act === "ce") return (programmerMode ? programmer : scientificMode ? scientific : standard).clearEntry();
    if (act === "c") {
      calc.clearAll();
      return;
    }
    if (act === "neg") return calc.negate();
    if (act === "pct") {
      if (scientificMode) scientific.postfix("%");
      else if (!programmerMode) standard.percent();
      return;
    }
    if (act.indexOf("op:") === 0) {
      const op = act.slice(3);
      if (programmerMode) programmer.operate(op === ":" ? "/" : op);
      else if (scientificMode) scientific.operate(op);
      else standard.operate(op);
      return;
    }
    if (act.indexOf("unary:") === 0) {
      if (scientificMode) scientific.call(act.slice(6) === "sqr" ? "sqr" : act.slice(6) === "sqrt" ? "sqrt" : "recip");
      else if (!programmerMode) standard.unary(act.slice(6));
      return;
    }
    if (act.indexOf("fn:") === 0) return scientific.call(act.slice(3));
    if (act.indexOf("const:") === 0) return scientific.constant(act.slice(6));
    if (act.indexOf("paren:") === 0) return scientific.parenthesis(act.slice(6));
    if (act.indexOf("prog:") === 0) {
      const op = act.slice(5);
      if (op === "not") programmer.not();
      else programmer.operate(op);
      return;
    }
    if (act === "eq") {
      pushHistory(calc.equals());
    }
  }

  function typeConverter(char) {
    const side = state.activeSide;
    let text = state[side] === "0" && char !== "," ? "" : state[side];
    if (char === "," && text.indexOf(",") !== -1) return;
    text += char;
    state[side] = text;
    syncConverter(side);
  }

  function onAction(act) {
    if (act === "menu") {
      state.menu = !state.menu;
      render();
      return;
    }
    if (act.indexOf("win:") === 0) {
      postHost(act.slice(4));
      return;
    }
    if (act === "closemenu") {
      state.menu = false;
      render();
      return;
    }
    if (act.indexOf("mode:") === 0) {
      const next = act.slice(5);
      state.mode = next;
      state.menu = false;
      state.panel = "keys";
      if (unitsApi.category(next)) {
        state.converterCategory = next;
        const pair = unitsApi.defaultPair(next);
        state.fromUnit = pair[0];
        state.toUnit = pair[1];
        state.left = "0";
        state.right = formatConverter(unitsApi.convert(next, pair[0], pair[1], 0));
        state.activeSide = "left";
      }
      render();
      return;
    }
    if (act === "history") {
      state.panel = state.panel === "history" ? "keys" : "history";
      render();
      return;
    }
    if (act === "memory") {
      state.panel = state.panel === "memory" ? "keys" : "memory";
      render();
      return;
    }
    if (act === "mc") {
      memory.splice(0, memory.length);
      render();
      return;
    }
    if (act === "mr") return recallMemory();
    if (act === "ms") {
      const value = currentNumber();
      if (value !== null) memoryStore(value);
      render();
      return;
    }
    if (act === "mplus" || act === "mminus") {
      const value = currentNumber();
      if (value === null) return;
      if (!memory.length) memoryStore(act === "mplus" ? value : -Number(value));
      else memory[0] = Number(memory[0]) + (act === "mplus" ? Number(value) : -Number(value));
      render();
      return;
    }
    if (act.indexOf("mrecall:") === 0) {
      activeCalc().setDisplay(memory[Number(act.slice(8))]);
      state.panel = "keys";
      render();
      return;
    }
    if (act.indexOf("mslotplus:") === 0 || act.indexOf("mslotminus:") === 0) {
      const plus = act.indexOf("mslotplus:") === 0;
      const index = Number(act.split(":")[1]);
      const value = currentNumber();
      if (value === null) return;
      memory[index] = Number(memory[index]) + (plus ? Number(value) : -Number(value));
      render();
      return;
    }
    if (act.indexOf("mslotclear:") === 0) {
      memory.splice(Number(act.slice(11)), 1);
      render();
      return;
    }
    if (act.indexOf("hist:") === 0) {
      const item = history[Number(act.slice(5))];
      if (item) activeCalc().setDisplay(item.value);
      state.panel = "keys";
      render();
      return;
    }
    if (act === "toggle:second") {
      state.second = !state.second;
      render();
      return;
    }
    if (act === "toggle:hyp") {
      state.hyp = !state.hyp;
      render();
      return;
    }
    if (act.indexOf("angle:") === 0) {
      scientific.angle = act.slice(6);
      render();
      return;
    }
    if (act.indexOf("base:") === 0) {
      programmer.setBase(Number(act.slice(5)));
      render();
      return;
    }
    if (act.indexOf("width:") === 0) {
      programmer.setWidth(Number(act.slice(6)));
      render();
      return;
    }
    if (act.indexOf("bit:") === 0) {
      programmer.toggleBit(Number(act.slice(4)));
      render();
      return;
    }
    if (act.indexOf("datemode:") === 0) {
      state.dateMode = act.slice(9);
      render();
      return;
    }
    if (act.indexOf("datesign:") === 0) {
      state.dateSign = act.slice(9);
      render();
      return;
    }
    if (act.indexOf("gangle:") === 0) {
      state.graph.angle = act.slice(7);
      render();
      return;
    }
    if (act === "eqadd") {
      const colors = ["#60cdff", "#ffb900", "#6ccb5f", "#ff99a4"];
      state.graph.equations.push({ text: "", color: colors[state.graph.equations.length % colors.length] });
      render();
      return;
    }
    if (act.indexOf("eqdel:") === 0 && state.graph.equations.length > 1) {
      state.graph.equations.splice(Number(act.slice(6)), 1);
      render();
      return;
    }
    if (act.indexOf("conv:") === 0) {
      const key = act.slice(5);
      if (key === "c") {
        state[state.activeSide] = "0";
        syncConverter(state.activeSide);
      } else if (key === "bs") {
        state[state.activeSide] = state[state.activeSide].slice(0, -1) || "0";
        syncConverter(state.activeSide);
      } else if (key === "dot") typeConverter(",");
      else if (key === "neg") {
        const text = state[state.activeSide];
        state[state.activeSide] = text.charAt(0) === "-" ? text.slice(1) || "0" : text === "0" ? "0" : "-" + text;
        syncConverter(state.activeSide);
      } else typeConverter(key);
      render();
      return;
    }
    if (isCalculatorMode()) {
      handleCalculator(act);
      render();
    }
  }

  root.addEventListener("click", function (event) {
    const target = event.target.closest("[data-act]");
    if (!target || !root.contains(target)) return;
    onAction(target.dataset.act);
  });

  root.addEventListener("mousedown", function (event) {
    if (event.button !== 0) return;
    if (!event.target.closest(".top")) return;
    if (event.target.closest("button")) return;
    postHost("drag");
  });

  root.addEventListener("dblclick", function (event) {
    if (!event.target.closest(".top") || event.target.closest("button")) return;
    postHost("max");
  });

  root.addEventListener("change", function (event) {
    const target = event.target;
    if (target.id === "date-from") state.dateFrom = target.value;
    if (target.id === "date-to") state.dateTo = target.value;
    if (target.id === "conv-from") {
      state.fromUnit = target.value;
      syncConverter(state.activeSide);
    }
    if (target.id === "conv-to") {
      state.toUnit = target.value;
      syncConverter(state.activeSide);
    }
    ["xmin", "xmax", "ymin", "ymax"].forEach(function (id) {
      if (target.id === id) state.graph[id === "xmin" ? "xMin" : id === "xmax" ? "xMax" : id === "ymin" ? "yMin" : "yMax"] = Number(target.value);
    });
    render();
  });

  root.addEventListener("input", function (event) {
    const target = event.target;
    if (target.dataset.eq !== undefined) {
      state.graph.equations[Number(target.dataset.eq)].text = target.value;
      drawGraph();
      return;
    }
    if (target.id === "date-days") {
      state.dateDays = target.value;
      const card = root.querySelector(".result-card b");
      if (card) {
        const from = parseIso(state.dateFrom);
        const days = Number(state.dateDays);
        const delta = state.dateSign === "-" ? -days : days;
        card.textContent = engine.addDays(from, Number.isFinite(days) ? delta : 0).toLocaleDateString("de-DE");
      }
      return;
    }
    if (target.id === "conv-left" || target.id === "conv-right") {
      state.activeSide = target.id === "conv-left" ? "left" : "right";
      state[state.activeSide] = target.value;
      syncConverter(state.activeSide);
      const other = document.getElementById(state.activeSide === "left" ? "conv-right" : "conv-left");
      if (other) other.value = state[state.activeSide === "left" ? "right" : "left"];
    }
  });

  root.addEventListener("focusin", function (event) {
    if (event.target.id === "conv-left") state.activeSide = "left";
    if (event.target.id === "conv-right") state.activeSide = "right";
  });

  let drag = null;
  root.addEventListener("pointerdown", function (event) {
    if (event.target.id !== "plot") return;
    drag = {
      x: event.clientX,
      y: event.clientY,
      xMin: state.graph.xMin,
      xMax: state.graph.xMax,
      yMin: state.graph.yMin,
      yMax: state.graph.yMax,
    };
    event.target.setPointerCapture(event.pointerId);
  });
  root.addEventListener("pointermove", function (event) {
    if (!drag || event.target.id !== "plot") return;
    const rect = event.target.getBoundingClientRect();
    const dx = (event.clientX - drag.x) / rect.width * (drag.xMax - drag.xMin);
    const dy = (event.clientY - drag.y) / rect.height * (drag.yMax - drag.yMin);
    state.graph.xMin = drag.xMin - dx;
    state.graph.xMax = drag.xMax - dx;
    state.graph.yMin = drag.yMin + dy;
    state.graph.yMax = drag.yMax + dy;
    drawGraph();
  });
  root.addEventListener("pointerup", function () { drag = null; });
  root.addEventListener("wheel", function (event) {
    if (event.target.id !== "plot") return;
    event.preventDefault();
    const scale = event.deltaY > 0 ? 1.1 : 0.9;
    const rect = event.target.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const x = state.graph.xMin + px * (state.graph.xMax - state.graph.xMin);
    const y = state.graph.yMax - py * (state.graph.yMax - state.graph.yMin);
    state.graph.xMin = x - (x - state.graph.xMin) * scale;
    state.graph.xMax = x + (state.graph.xMax - x) * scale;
    state.graph.yMin = y - (y - state.graph.yMin) * scale;
    state.graph.yMax = y + (state.graph.yMax - y) * scale;
    drawGraph();
  }, { passive: false });

  window.addEventListener("keydown", function (event) {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (!isCalculatorMode()) return;
    const key = event.key;
    if (event.ctrlKey && key.toLowerCase() === "c") {
      const value = activeCalc().snapshot().display;
      if (navigator.clipboard) navigator.clipboard.writeText(value);
      return;
    }
    if (event.ctrlKey && key.toLowerCase() === "v") {
      if (!navigator.clipboard) return;
      navigator.clipboard.readText().then(function (text) {
        const match = String(text).replace(",", ".").match(/-?\d+(\.\d+)?([eE][+-]?\d+)?/);
        if (match) activeCalc().setDisplay(match[0]);
        render();
      }).catch(function () {});
      return;
    }
    if (/^[0-9]$/.test(key) || (state.mode === "programmer" && /^[a-fA-F]$/.test(key))) {
      onAction("d:" + key.toUpperCase());
      event.preventDefault();
      return;
    }
    const ops = { "+": "+", "-": "-", "*": "*", "/": "/" };
    if (ops[key]) {
      onAction("op:" + ops[key]);
      event.preventDefault();
      return;
    }
    if (key === "," || key === ".") {
      onAction("dot");
      event.preventDefault();
    } else if (key === "Enter" || key === "=") {
      onAction("eq");
      event.preventDefault();
    } else if (key === "Escape") onAction("c");
    else if (key === "Delete") onAction("ce");
    else if (key === "Backspace") {
      onAction("bs");
      event.preventDefault();
    } else if (key === "%") onAction("pct");
    else if (key === "F9") onAction("neg");
    else if (key === "@") onAction(state.mode === "scientific" ? "fn:sqrt" : "unary:sqrt");
    else if (key.toLowerCase() === "r") onAction(state.mode === "scientific" ? "fn:recip" : "unary:recip");
  });

  window.addEventListener("resize", function () {
    fitValue();
    if (state.mode === "graphing") drawGraph();
  });

  render();
})();
