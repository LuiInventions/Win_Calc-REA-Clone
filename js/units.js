(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CalcUnits = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function linear(id, name, abbr, factor) {
    return { id: id, name: name, abbr: abbr, factor: factor };
  }

  function prefix(pairs, unit, abbr, scale) {
    return pairs.map(function (pair) {
      return linear(pair[0] + unit, pair[2] || pair[0] + unit, pair[3] || pair[0].toLowerCase() + abbr, pair[1] * scale);
    });
  }

  const siBits = [
    ["", 1, "Bit", "bit"],
    ["Kilo", 1e3, "Kilobit", "kbit"],
    ["Mega", 1e6, "Megabit", "Mbit"],
    ["Giga", 1e9, "Gigabit", "Gbit"],
    ["Tera", 1e12, "Terabit", "Tbit"],
    ["Peta", 1e15, "Petabit", "Pbit"],
    ["Exa", 1e18, "Exabit", "Ebit"],
    ["Zeta", 1e21, "Zetabit", "Zbit"],
    ["Yotta", 1e24, "Yottabit", "Ybit"],
  ];
  const iecBits = [
    ["Kibi", 1024, "Kibibit", "Kibit"],
    ["Mebi", Math.pow(1024, 2), "Mebibit", "Mibit"],
    ["Gibi", Math.pow(1024, 3), "Gibibit", "Gibit"],
    ["Tebi", Math.pow(1024, 4), "Tebibit", "Tibit"],
    ["Pebi", Math.pow(1024, 5), "Pebibit", "Pibit"],
    ["Exbi", Math.pow(1024, 6), "Exbibit", "Eibit"],
    ["Zebi", Math.pow(1024, 7), "Zebibit", "Zibit"],
    ["Yobi", Math.pow(1024, 8), "Yobibit", "Yibit"],
  ];

  function dataFamily(bitNames, byteScale) {
    return bitNames.map(function (pair) {
      const id = pair[0] === "" ? (byteScale === 1 ? "Bit" : "Byte") : pair[0] + (byteScale === 1 ? "bit" : "byte");
      const observed = byteScale === 1 ? pair[4] : pair[5];
      return linear(observed, pair[2], pair[3], pair[1] * byteScale);
    });
  }

  const bitRows = [
    ["", 1, "Bit", "bit", "Bit", "Byte"],
    ["Kilo", 1e3, "Kilobit", "kbit", "Kilobit", "Kilobyte"],
    ["Mega", 1e6, "Megabit", "Mbit", "Megabit", "Megabyte"],
    ["Giga", 1e9, "Gigabit", "Gbit", "Gigabit", "Gigabyte"],
    ["Tera", 1e12, "Terabit", "Tbit", "Terabit", "Terabyte"],
    ["Peta", 1e15, "Petabit", "Pbit", "Petabit", "Petabyte"],
    ["Exa", 1e18, "Exabit", "Ebit", "Exabits", "Exabytes"],
    ["Zeta", 1e21, "Zetabit", "Zbit", "Zetabits", "Zetabytes"],
    ["Yotta", 1e24, "Yottabit", "Ybit", "Yottabit", "Yottabyte"],
    ["Kibi", 1024, "Kibibit", "Kibit", "Kibibits", "Kibibytes"],
    ["Mebi", Math.pow(1024, 2), "Mebibit", "Mibit", "Mebibits", "Mebibytes"],
    ["Gibi", Math.pow(1024, 3), "Gibibit", "Gibit", "Gibibits", "Gibibytes"],
    ["Tebi", Math.pow(1024, 4), "Tebibit", "Tibit", "Tebibits", "Tebibytes"],
    ["Pebi", Math.pow(1024, 5), "Pebibit", "Pibit", "Pebibits", "Pebibytes"],
    ["Exbi", Math.pow(1024, 6), "Exbibit", "Eibit", "Exbibits", "Exbibytes"],
    ["Zebi", Math.pow(1024, 7), "Zebibit", "Zibit", "Zebibits", "Zebibytes"],
    ["Yobi", Math.pow(1024, 8), "Yobibit", "Yibit", "Yobibits", "Yobibytes"],
  ];

  const dataUnits = [linear("Nibble", "Nibble", "Nibble", 4)]
    .concat(dataFamily(bitRows, 1))
    .concat(bitRows.filter(function (row) { return row[0] !== "" || true; }).map(function (row) {
      return linear(row[5], row[0] === "" ? "Byte" : row[2].replace("bit", "byte"), row[0] === "" ? "B" : row[3].replace("bit", "B"), row[1] * 8);
    }))
    .concat([
      linear("FloppyDisk", "Diskette", "Floppy", 1474560 * 8),
      linear("CD", "CD", "CD", 700 * 1000 * 1000 * 8),
      linear("DVD", "DVD", "DVD", 4.7 * 1000 * 1000 * 1000 * 8),
    ]);

  const categories = [
    {
      id: "currency",
      name: "Währung",
      note: "Beispielkurse in Euro, kein Live-Abruf.",
      units: [
        linear("EUR", "Euro", "€", 1),
        linear("USD", "US-Dollar", "$", 0.92),
        linear("GBP", "Britisches Pfund", "£", 1.17),
        linear("CHF", "Schweizer Franken", "CHF", 1.05),
        linear("JPY", "Japanischer Yen", "¥", 0.0061),
        linear("CAD", "Kanadischer Dollar", "CA$", 0.68),
        linear("AUD", "Australischer Dollar", "A$", 0.61),
        linear("CNY", "Renminbi", "¥", 0.13),
        linear("SEK", "Schwedische Krone", "kr", 0.088),
        linear("NOK", "Norwegische Krone", "kr", 0.086),
        linear("DKK", "Dänische Krone", "kr", 0.134),
        linear("PLN", "Polnischer Zloty", "zł", 0.23),
        linear("CZK", "Tschechische Krone", "Kč", 0.04),
        linear("INR", "Indische Rupie", "₹", 0.011),
        linear("BRL", "Brasilianischer Real", "R$", 0.17),
        linear("MXN", "Mexikanischer Peso", "MX$", 0.05),
        linear("KRW", "Südkoreanischer Won", "₩", 0.00068),
        linear("TRY", "Türkische Lira", "₺", 0.027),
      ],
    },
    {
      id: "volume",
      name: "Volumen",
      units: [
        linear("Milliliter", "Milliliter", "ml", 1e-6),
        linear("CubicCentimeter", "Kubikzentimeter", "cm³", 1e-6),
        linear("Liter", "Liter", "l", 0.001),
        linear("CubicMeter", "Kubikmeter", "m³", 1),
        linear("CubicInch", "Kubikzoll", "in³", 1.6387064e-5),
        linear("CubicFoot", "Kubikfuß", "ft³", 0.028316846592),
        linear("CubicYard", "Kubikyard", "yd³", 0.764554857984),
        linear("TeaspoonUS", "Teelöffel (US)", "tsp", 4.92892159375e-6),
        linear("TablespoonUS", "Esslöffel (US)", "tbsp", 1.478676478125e-5),
        linear("FluidOunceUS", "Flüssigunze (US)", "fl oz", 2.95735295625e-5),
        linear("CupUS", "Tasse (US)", "cup", 2.365882365e-4),
        linear("PintUS", "Pint (US)", "pt", 4.73176473e-4),
        linear("QuartUS", "Quart (US)", "qt", 9.46352946e-4),
        linear("GallonUS", "Gallone (US)", "gal", 0.003785411784),
        linear("TeaspoonUK", "Teelöffel (UK)", "tsp", 5.91938802083e-6),
        linear("TablespoonUK", "Esslöffel (UK)", "tbsp", 1.77581640625e-5),
        linear("FluidOunceUK", "Flüssigunze (UK)", "fl oz", 2.84130625e-5),
        linear("PintUK", "Pint (UK)", "pt", 5.6826125e-4),
        linear("QuartUK", "Quart (UK)", "qt", 0.0011365225),
        linear("GallonUK", "Gallone (UK)", "gal", 0.00454609),
        linear("CoffeeCup", "Kaffeetasse", "Tasse", 0.0002),
        linear("Bathtub", "Badewanne", "Wanne", 0.15),
        linear("SwimmingPool", "Schwimmbecken", "Becken", 2500),
      ],
    },
    {
      id: "length",
      name: "Länge",
      units: [
        linear("Angstrom", "Ångström", "Å", 1e-10),
        linear("Nanometer", "Nanometer", "nm", 1e-9),
        linear("Micron", "Mikrometer", "µm", 1e-6),
        linear("Millimeter", "Millimeter", "mm", 0.001),
        linear("Centimeter", "Zentimeter", "cm", 0.01),
        linear("Meter", "Meter", "m", 1),
        linear("Kilometer", "Kilometer", "km", 1000),
        linear("Inch", "Zoll", "in", 0.0254),
        linear("Foot", "Fuß", "ft", 0.3048),
        linear("Yard", "Yard", "yd", 0.9144),
        linear("Mile", "Meile", "mi", 1609.344),
        linear("NauticalMile", "Seemeile", "sm", 1852),
        linear("Hand", "Hand", "hand", 0.1016),
        linear("Paperclip", "Büroklammer", "Klammer", 0.035),
        linear("JumboJet", "Großraumflugzeug", "Jet", 70.66),
      ],
    },
    {
      id: "weight",
      name: "Gewicht und Masse",
      units: [
        linear("Carat", "Karat", "ct", 0.0002),
        linear("Milligram", "Milligramm", "mg", 1e-6),
        linear("Centigram", "Zentigramm", "cg", 1e-5),
        linear("Decigram", "Dezigramm", "dg", 1e-4),
        linear("Gram", "Gramm", "g", 0.001),
        linear("Decagram", "Dekagramm", "dag", 0.01),
        linear("Hectogram", "Hektogramm", "hg", 0.1),
        linear("Kilogram", "Kilogramm", "kg", 1),
        linear("Tonne", "Tonne", "t", 1000),
        linear("Ounce", "Unze", "oz", 0.028349523125),
        linear("Pound", "Pfund", "lb", 0.45359237),
        linear("Stone", "Stone", "st", 6.35029318),
        linear("ShortTon", "Short Ton", "tn", 907.18474),
        linear("LongTon", "Long Ton", "ton", 1016.0469088),
        linear("Snowflake", "Schneeflocke", "Flocke", 0.000003),
        linear("SoccerBall", "Fußball", "Ball", 0.43),
        linear("Elephant", "Elefant", "Elefant", 4000),
        linear("Whale", "Wal", "Wal", 100000),
      ],
    },
    {
      id: "temperature",
      name: "Temperatur",
      units: [
        { id: "DegreesCelsius", name: "Celsius", abbr: "°C", toBase: function (v) { return v + 273.15; }, fromBase: function (v) { return v - 273.15; } },
        { id: "DegreesFahrenheit", name: "Fahrenheit", abbr: "°F", toBase: function (v) { return (v - 32) * 5 / 9 + 273.15; }, fromBase: function (v) { return (v - 273.15) * 9 / 5 + 32; } },
        { id: "Kelvin", name: "Kelvin", abbr: "K", toBase: function (v) { return v; }, fromBase: function (v) { return v; } },
      ],
    },
    {
      id: "energy",
      name: "Energie",
      units: [
        linear("Electron-Volt", "Elektronenvolt", "eV", 1.602176634e-19),
        linear("Joule", "Joule", "J", 1),
        linear("Kilojoule", "Kilojoule", "kJ", 1000),
        linear("Calorie", "Kalorie", "cal", 4.184),
        linear("Kilocalorie", "Kilokalorie", "kcal", 4184),
        linear("Foot-Pound", "Fuß-Pfund", "ft⋅lb", 1.3558179483314004),
        linear("BritishThermalUnit", "British thermal unit", "BTU", 1055.05585262),
        linear("Kilowatthour", "Kilowattstunde", "kWh", 3600000),
        linear("Battery", "Batterie", "AA", 9000),
        linear("Banana", "Banane", "Banane", 439320),
        linear("SliceOfCake", "Kuchenstück", "Stück", 1046000),
      ],
    },
    {
      id: "area",
      name: "Fläche",
      units: [
        linear("SquareMillimeter", "Quadratmillimeter", "mm²", 1e-6),
        linear("SquareCentimeter", "Quadratzentimeter", "cm²", 1e-4),
        linear("SquareMeter", "Quadratmeter", "m²", 1),
        linear("Hectare", "Hektar", "ha", 10000),
        linear("SquareKilometer", "Quadratkilometer", "km²", 1e6),
        linear("SquareInch", "Quadratzoll", "in²", 0.00064516),
        linear("SquareFoot", "Quadratfuß", "ft²", 0.09290304),
        linear("SquareYard", "Quadratyard", "yd²", 0.83612736),
        linear("Acre", "Acre", "ac", 4046.8564224),
        linear("SquareMile", "Quadratmeile", "mi²", 2589988.110336),
        linear("Pyeong", "Pyeong", "py", 3.305785),
        linear("Paper", "Blatt Papier", "A4", 0.06237),
        linear("SoccerField", "Fußballfeld", "Feld", 7140),
        linear("Castle", "Burg", "Burg", 10000),
      ],
    },
    {
      id: "speed",
      name: "Geschwindigkeit",
      units: [
        linear("CentimetersPerSecond", "Zentimeter pro Sekunde", "cm/s", 0.01),
        linear("MetersPerSecond", "Meter pro Sekunde", "m/s", 1),
        linear("FeetPerSecond", "Fuß pro Sekunde", "ft/s", 0.3048),
        linear("KilometersPerHour", "Kilometer pro Stunde", "km/h", 1 / 3.6),
        linear("MilesPerHour", "Meilen pro Stunde", "mph", 0.44704),
        linear("Knot", "Knoten", "kn", 0.514444444444),
        linear("Mach", "Mach", "Ma", 340.29),
        linear("Turtle", "Schildkröte", "Schildkröte", 0.0003),
        linear("Jet", "Düsenflugzeug", "Jet", 250),
      ],
    },
    {
      id: "time",
      name: "Zeit",
      units: [
        linear("Microsecond", "Mikrosekunde", "µs", 1e-6),
        linear("Millisecond", "Millisekunde", "ms", 0.001),
        linear("Second", "Sekunde", "s", 1),
        linear("Minute", "Minute", "min", 60),
        linear("Hour", "Stunde", "h", 3600),
        linear("Day", "Tag", "d", 86400),
        linear("Week", "Woche", "Woche", 604800),
        linear("Year", "Jahr", "a", 31557600),
      ],
    },
    {
      id: "power",
      name: "Leistung",
      units: [
        linear("Watt", "Watt", "W", 1),
        linear("Kilowatt", "Kilowatt", "kW", 1000),
        linear("Horsepower", "Pferdestärke", "PS", 745.6998715822702),
        linear("Foot-PoundPerMinute", "Fuß-Pfund pro Minute", "ft⋅lb/min", 0.0225969658055),
        linear("BTUPerMinute", "BTU pro Minute", "BTU/min", 17.5842642103),
        linear("LightBulb", "Glühbirne", "Birne", 60),
        linear("Horse", "Pferd", "Pferd", 745.7),
        linear("TrainEngine", "Lokomotive", "Lok", 3000000),
      ],
    },
    {
      id: "data",
      name: "Daten",
      units: dataUnits,
    },
    {
      id: "pressure",
      name: "Druck",
      units: [
        linear("Pascal", "Pascal", "Pa", 1),
        linear("KiloPascal", "Kilopascal", "kPa", 1000),
        linear("Bar", "Bar", "bar", 100000),
        linear("PSI", "Pfund pro Quadratzoll", "psi", 6894.757293168),
        linear("Atmosphere", "Atmosphäre", "atm", 101325),
        linear("MillimeterOfMercury", "Millimeter Quecksilbersäule", "mmHg", 133.322387415),
      ],
    },
    {
      id: "angle",
      name: "Winkel",
      units: [
        linear("Degree", "Grad", "°", Math.PI / 180),
        linear("Radian", "Radiant", "rad", 1),
        linear("Gradian", "Gon", "gon", Math.PI / 200),
      ],
    },
  ];

  function category(id) {
    for (let i = 0; i < categories.length; i += 1) {
      if (categories[i].id === id) return categories[i];
    }
    return null;
  }

  function unit(cat, id) {
    const units = cat.units;
    for (let i = 0; i < units.length; i += 1) {
      if (units[i].id === id) return units[i];
    }
    return null;
  }

  function convert(categoryId, fromId, toId, value) {
    const cat = category(categoryId);
    if (!cat) throw new Error("unknown category");
    const from = unit(cat, fromId);
    const to = unit(cat, toId);
    if (!from || !to) throw new Error("unknown unit");
    const base = from.toBase ? from.toBase(value) : value * from.factor;
    if (!isFinite(base)) return base;
    return to.fromBase ? to.fromBase(base) : base / to.factor;
  }

  function defaultPair(categoryId) {
    const pairs = {
      currency: ["EUR", "USD"],
      volume: ["Liter", "Milliliter"],
      length: ["Meter", "Kilometer"],
      weight: ["Kilogram", "Gram"],
      temperature: ["DegreesCelsius", "DegreesFahrenheit"],
      energy: ["Joule", "Kilocalorie"],
      area: ["SquareMeter", "SquareKilometer"],
      speed: ["KilometersPerHour", "MilesPerHour"],
      time: ["Minute", "Second"],
      power: ["Kilowatt", "Horsepower"],
      data: ["Megabyte", "Mebibytes"],
      pressure: ["Bar", "PSI"],
      angle: ["Degree", "Radian"],
    };
    return pairs[categoryId] || [category(categoryId).units[0].id, category(categoryId).units[1].id];
  }

  return {
    categories: categories,
    category: category,
    convert: convert,
    defaultPair: defaultPair,
  };
});
