export function getIndianFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    const nextShort = String((year + 1) % 100).padStart(2, "0");
    return `${year}-${nextShort}`;
  }

  const prev = year - 1;
  const currShort = String(year % 100).padStart(2, "0");
  return `${prev}-${currShort}`;
}   