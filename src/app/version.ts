const fallback = 0;

function parseSegment(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Compares two semantic versions (major.minor.patch). Pre-release tags are
 * ignored on purpose: they are not part of the desktop updater contract.
 */
export function compareVersions(left: string, right: string): number {
  const leftParts = left.split("-")[0]?.split(".") ?? [];
  const rightParts = right.split("-")[0]?.split(".") ?? [];
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = parseSegment(leftParts[index]) - parseSegment(rightParts[index]);

    if (difference !== 0) {
      return difference > 0 ? 1 : -1;
    }
  }

  return 0;
}
