export const printerConfig = {
  buildVolumeMm: {
    x: 256,
    y: 256,
    z: 260
  }
} as const;

export function formatBuildVolume() {
  const { x, y, z } = printerConfig.buildVolumeMm;
  return `${x} x ${y} x ${z} mm`;
}
