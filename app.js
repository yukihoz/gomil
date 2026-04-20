const csvFileName = "./ゴミ収集日2026 - 完成.csv";
const icons = {
  burnable: `<svg viewBox="0 0 48 48" role="img" aria-label="燃やすごみ"><path d="M25 43c8 0 14-5 14-13 0-6-4-11-8-15 0 6-4 9-7 9 2-8-2-14-8-19 1 9-7 14-7 24 0 8 7 14 16 14z" fill="currentColor"/></svg>`,
  nonBurnable: `<svg viewBox="0 0 48 48" role="img" aria-label="燃やさないごみ"><path d="M12 16l12-7 12 7v16L24 39 12 32V16z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M12 16l12 7 12-7M24 23v16" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>`,
  plastic: `<svg viewBox="0 0 48 48" role="img" aria-label="プラマーク"><path d="M17 12h14l5 8-12 18L12 20l5-8z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M17 12l7 26 7-26" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>`,
  resource: `<svg viewBox="0 0 48 48" role="img" aria-label="資源"><path d="M18 7h12v8l5 6v18H13V21l5-6V7z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M17 27h14" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`,
  oversized: `<svg viewBox="0 0 48 48" role="img" aria-label="粗大ごみ"><path d="M10 25h28v12H10V25zM14 17h20v8H14v-8z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M15 37v4M33 37v4" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`,
};
const categories = [
  { key: "燃やすごみ", label: "燃やすごみ", icon: icons.burnable, kind: "burnable" },
  { key: "燃やさないごみ", label: "燃やさないごみ", icon: icons.nonBurnable, kind: "nonBurnable" },
  { key: "プラマーク", label: "プラマーク", icon: icons.plastic, kind: "plastic" },
  { key: "資源", label: "資源", icon: icons.resource, kind: "resource" },
  { key: "粗大ごみ", label: "粗大ごみ", icon: icons.oversized, kind: "oversized" },
];
const weekdayChars = ["日", "月", "火", "水", "木", "金", "土"];
const postalCodes = {
  "八重洲１丁目": "1030028",
  "八重洲２丁目": "1040028",
  京橋: "1040031",
  銀座: "1040061",
  新富: "1040041",
  入船: "1040042",
  湊: "1040043",
  明石町: "1040044",
  築地: "1040045",
  浜離宮庭園: "1040046",
  八丁堀: "1040032",
  新川: "1040033",
  日本橋本石町: "1030021",
  日本橋室町: "1030022",
  日本橋本町: "1030023",
  日本橋小舟町: "1030024",
  日本橋小伝馬町: "1030001",
  日本橋大伝馬町: "1030011",
  日本橋堀留町: "1030012",
  日本橋富沢町: "1030006",
  日本橋人形町: "1030013",
  日本橋小網町: "1030016",
  日本橋蛎殻町: "1030014",
  日本橋箱崎町: "1030015",
  日本橋馬喰町: "1030002",
  日本橋横山町: "1030003",
  東日本橋: "1030004",
  日本橋久松町: "1030005",
  日本橋浜町: "1030007",
  日本橋中洲: "1030008",
  日本橋茅場町: "1030025",
  日本橋兜町: "1030026",
  日本橋: "1030027",
  佃: "1040051",
  月島: "1040052",
  晴海: "1040053",
  勝どき: "1040054",
  豊海町: "1040055",
};

const form = document.querySelector("#search-form");
const input = document.querySelector("#address-input");
const options = document.querySelector("#address-options");
const searchButton = form.querySelector("button");
const resultsArea = document.querySelector("#results-area");
const emptyState = document.querySelector("#empty-state");
const resultHeader = document.querySelector("#result-header");
const placeName = document.querySelector("#place-name");
const scheduleGrid = document.querySelector("#schedule-grid");
const searchToday = document.querySelector("#search-today");

let collectionRows = [];
let selectedRow = null;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...body] = rows;
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function normalizeAddress(value) {
  return value
    .normalize("NFKC")
    .replace(/東京都|中央区/g, "")
    .replace(/[ 　-]/g, "")
    .replace(/([0-9]+)丁目/g, "$1丁目")
    .toLowerCase();
}

function normalizePostalCode(value) {
  return value.normalize("NFKC").replace(/[^0-9]/g, "");
}

function baseAreaName(value) {
  const normalized = value.normalize("NFKC");
  const exactBase = Object.keys(postalCodes)
    .filter((area) => normalized.startsWith(area.normalize("NFKC")))
    .sort((a, b) => b.length - a.length)[0];
  if (exactBase) return exactBase;
  return normalized.replace(/[0-9]+丁目.*$/, "").replace(/[0-9]+番.*$/, "");
}

function enrichRow(row) {
  const area = baseAreaName(row["名称"]);
  return {
    ...row,
    area,
    postalCode: postalCodes[area] || "",
  };
}

function formatPostalCode(code) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

function scheduleSignature(row) {
  return categories.map((category) => row[category.key]).join("|");
}

function addressParts(name) {
  const normalized = name.normalize("NFKC");
  const match = normalized.match(/^(.*?[0-9]+丁目)(?:(\d+)番)?$/);
  if (!match) return { stem: normalized, number: null };
  return {
    stem: match[1],
    number: match[2] ? Number(match[2]) : null,
  };
}

function groupedLabel(group) {
  const firstParts = addressParts(group.rows[0]["名称"]);
  const lastParts = addressParts(group.rows[group.rows.length - 1]["名称"]);

  if (group.rows.length === 1 || firstParts.number === null || lastParts.number === null) {
    return group.rows[0]["名称"];
  }

  return `${firstParts.stem} ${firstParts.number}〜${lastParts.number}番`;
}

function compactMatches(rows) {
  const groups = [];
  rows.forEach((row) => {
    const parts = addressParts(row["名称"]);
    const signature = scheduleSignature(row);
    const previous = groups[groups.length - 1];
    const previousLast = previous ? previous.parts[previous.parts.length - 1] : null;
    const canMerge =
      previous &&
      previous.signature === signature &&
      previous.area === row.area &&
      previousLast.stem === parts.stem &&
      previousLast.number !== null &&
      parts.number !== null &&
      previousLast.number + 1 === parts.number;

    if (canMerge) {
      previous.rows.push(row);
      previous.parts.push(parts);
      previous.label = groupedLabel(previous);
    } else {
      const group = {
        area: row.area,
        signature,
        rows: [row],
        parts: [parts],
        label: row["名称"],
      };
      group.label = groupedLabel(group);
      groups.push(group);
    }
  });
  return groups;
}

function findMatches(query) {
  const normalized = normalizeAddress(query);
  const postalQuery = normalizePostalCode(query);
  if (!normalized) return [];

  if (postalQuery.length >= 3) {
    const postalMatches = collectionRows
      .filter((row) => row.postalCode.startsWith(postalQuery))
      .sort((a, b) => Number(a["No."]) - Number(b["No."]));
    if (postalMatches.length) return postalMatches.slice(0, 80);
  }

  return collectionRows
    .map((row) => {
      const target = normalizeAddress(row["名称"]);
      let score = 0;
      if (target === normalized) score = 100;
      else if (target.startsWith(normalized)) score = 80;
      else if (target.includes(normalized)) score = 60;
      else if (normalized.includes(target)) score = 50;
      return { row, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.row["No."]) - Number(b.row["No."]))
    .slice(0, 80)
    .map((item) => item.row);
}

function categoriesForDay(row, dayChar) {
  return categories
    .filter((category) => row[category.key].split("・").includes(dayChar))
    .map((category) => category.label);
}

function renderSchedule(row, label = row["名称"]) {
  selectedRow = row;
  resultsArea.hidden = false;
  emptyState.hidden = true;
  resultHeader.hidden = false;
  placeName.textContent = label;
  scheduleGrid.innerHTML = "";

  renderSearchToday(row);

  const today = new Date();
  const todayChar = weekdayChars[today.getDay()];
  categories.forEach((category, index) => {
    const card = document.createElement("article");
    card.className = "schedule-card";
    card.dataset.kind = category.kind;
    card.dataset.active = String(row[category.key].split("・").includes(todayChar));
    card.style.setProperty("--enter-delay", `${90 + index * 70}ms`);
    card.innerHTML = `
      <div class="card-top">
        <p class="category-name">${category.label}</p>
        <span class="mark">${category.icon}</span>
      </div>
      <div>
        <p class="days">${row[category.key]}</p>
      </div>
    `;
    card.classList.add("card-enter");
    scheduleGrid.append(card);
  });
}

function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function renderSearchToday(row) {
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}/${today.getDate()}`;
  const dayChar = weekdayChars[today.getDay()];
  const todayItems = categoriesForDay(row, dayChar);
  const todayKinds = categories.filter((category) => row[category.key].split("・").includes(dayChar));
  const theme = todayKinds[0]?.kind || "none";
  searchToday.hidden = false;
  searchToday.dataset.theme = theme;
  searchToday.innerHTML = `
    <div class="today-copy">
      <span>今日は${dateLabel}。${dayChar}曜日です。</span>
      <strong>${todayItems.length ? `${todayItems.join("・")}の日です` : "収集予定はありません"}</strong>
    </div>
    <div class="today-icons">
      ${todayKinds.length ? todayKinds.map((category) => `<span class="today-icon">${category.icon}</span>`).join("") : `<span class="today-icon today-icon-empty">—</span>`}
    </div>
  `;
  restartAnimation(searchToday, "today-enter");
}

function renderMatches(matches, query) {
  if (!matches.length) {
    resultsArea.hidden = false;
    resultHeader.hidden = true;
    scheduleGrid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.innerHTML = `<div><p>「${query}」に一致する住所が見つかりませんでした。</p><p class="hint">郵便番号、町名、丁目、番地までのいずれかで試してください。</p></div>`;
    searchToday.hidden = true;
    delete searchToday.dataset.theme;
    searchToday.innerHTML = "";
    return;
  }

  const groups = compactMatches(matches);
  renderSchedule(groups[0].rows[0], groups[0].label);

  if (groups.length > 1) {
    const list = document.createElement("ul");
    list.className = "match-list";
    groups.forEach((group) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = group.label;
      button.addEventListener("click", () => {
        input.value = group.label;
        renderSchedule(group.rows[0], group.label);
      });
      item.append(button);
      list.append(item);
    });
    scheduleGrid.append(list);
  }
}

function search() {
  restartAnimation(searchButton, "button-press");
  const query = input.value.trim();
  const matches = findMatches(query);
  renderMatches(matches, query);
}

async function init() {
  try {
    let csvText = window.GOMI_CSV_DATA || "";
    if (!csvText) {
      const response = await fetch(encodeURI(csvFileName));
      if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);
      csvText = await response.text();
    }
    collectionRows = parseCsv(csvText).map(enrichRow);

    const postalOptions = [...new Map(collectionRows.filter((row) => row.postalCode).map((row) => [row.postalCode, row.area])).entries()]
      .map(([code, area]) => `<option value="${formatPostalCode(code)}">${area}</option>`)
      .join("");
    options.innerHTML = collectionRows.map((row) => `<option value="${row["名称"]}"></option>`).join("") + postalOptions;
    resultsArea.hidden = true;
    resultHeader.hidden = true;
    scheduleGrid.innerHTML = "";
    emptyState.hidden = true;
    searchToday.hidden = true;
    delete searchToday.dataset.theme;
    searchToday.innerHTML = "";
  } catch (error) {
    resultsArea.hidden = false;
    emptyState.hidden = false;
    emptyState.innerHTML = "<p>データを読み込めませんでした。ローカルサーバー経由で開いてください。</p>";
    console.error(error);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search();
});

input.addEventListener("input", () => {
  const exact = collectionRows.find((row) => normalizeAddress(row["名称"]) === normalizeAddress(input.value));
  if (exact && exact !== selectedRow) renderSchedule(exact);
});

init();
