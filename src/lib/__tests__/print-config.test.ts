import { describe, it, expect } from "vitest";
import { printerConfig, formatBuildVolume } from "../print-config";

describe("printerConfig", () => {
  it("has positive build volume dimensions", () => {
    expect(printerConfig.buildVolumeMm.x).toBeGreaterThan(0);
    expect(printerConfig.buildVolumeMm.y).toBeGreaterThan(0);
    expect(printerConfig.buildVolumeMm.z).toBeGreaterThan(0);
  });

  it("matches expected Bambu build volume", () => {
    expect(printerConfig.buildVolumeMm.x).toBe(256);
    expect(printerConfig.buildVolumeMm.y).toBe(256);
    expect(printerConfig.buildVolumeMm.z).toBe(260);
  });
});

describe("formatBuildVolume", () => {
  it("returns a string with the x, y, z values", () => {
    const result = formatBuildVolume();
    expect(typeof result).toBe("string");
    expect(result).toContain("256");
    expect(result).toContain("260");
  });

  it("includes mm unit", () => {
    expect(formatBuildVolume()).toContain("mm");
  });
});
