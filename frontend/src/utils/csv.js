// CSV para abrir direto no Excel em portugues: separador ";" e BOM UTF-8
// (sem o BOM o Excel quebra os acentos).
const SEPARATOR = ";";

function cell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// columns: [{ label, value: (row) => any }]
export function toCsv(rows, columns) {
  const header = columns.map((c) => cell(c.label)).join(SEPARATOR);
  const lines = rows.map((row) => columns.map((c) => cell(c.value(row))).join(SEPARATOR));
  return "﻿" + [header, ...lines].join("\r\n");
}

export function downloadCsv(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
