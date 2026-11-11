// CSV as spreadsheets and banks write it (RFC 4180): quoted fields may hold
// the separator, line breaks and doubled quotes ("").

/** The separator a file uses: comma, semicolon or tab, whichever its first line has most of. */
function separatorOf(text: string): string {
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const counts = [",", ";", "\t"].map((separator) => ({
    separator,
    count: firstLine.split(separator).length,
  }));
  return counts.sort((a, b) => b.count - a.count)[0].separator;
}

/** A row of cells and the line of the file it starts on (1 is the first). */
export type CsvRow = { line: number; cells: string[] };

/**
 * Rows of cells with their line numbers. A leading byte order mark is dropped
 * and blank lines are skipped. A cell written as '=… (the guard toCsv adds) is
 * read back as =….
 */
export function parseCsvLines(input: string): CsvRow[] {
  const text = input.replace(/^\uFEFF/, "");
  const separator = separatorOf(text);
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let rowLine = 1;

  const endCell = () => {
    cells.push(/^'[=+\-@]/.test(cell) ? cell.slice(1) : cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (cells.some((value) => value.trim() !== "")) rows.push({ line: rowLine, cells });
    cells = [];
  };

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === "\n") line++;
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.trim() === "") {
      quoted = true;
      cell = "";
    } else if (char === separator) {
      endCell();
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") {
        index++;
        line++;
      } else if (char === "\r") {
        line++;
      }
      endRow();
      rowLine = line;
    } else {
      cell += char;
    }
  }
  if (cell !== "" || cells.length > 0) endRow();
  return rows;
}

/** Rows of cells (see parseCsvLines). */
export function parseCsv(input: string): string[][] {
  return parseCsvLines(input).map((row) => row.cells);
}

export type CsvValue = string | number | null | undefined;

/**
 * One cell, quoted when it needs to be. Text starting with = + - @ is
 * prefixed with ' so spreadsheets show it rather than run it as a formula;
 * numbers are written as they are.
 */
function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows as CSV text with CRLF line ends, as spreadsheets expect. */
export function toCsv(rows: readonly (readonly CsvValue[])[]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
