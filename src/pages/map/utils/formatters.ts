export function formatSurface(m2: number): string {
  const ha = Math.floor(m2 / 10000);
  const reste = m2 % 10000;
  const a = Math.floor(reste / 100);
  const ca = Math.floor(reste % 100);

  return `${ha} ha ${a} a ${ca.toString().padStart(2, "0")} ca`;
}
