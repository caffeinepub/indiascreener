export function formatCurrency(value: number, decimals = 2): string {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatMarketCap(crores: number): string {
  if (crores >= 100000) {
    return `₹${(crores / 100000).toFixed(2)}L Cr`;
  }
  if (crores >= 1000) {
    return `₹${(crores / 1000).toFixed(2)}K Cr`;
  }
  return `₹${crores.toFixed(2)} Cr`;
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatRatio(value: number): string {
  return value.toFixed(2);
}

export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val == null ? "" : String(val);
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
