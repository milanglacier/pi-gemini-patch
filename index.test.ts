import { describe, it, expect, vi } from "vitest";
import geminiSafetyPatch, {
  isGeminiModel,
  patchGeminiSafetySettings,
  GEMINI_BLOCK_NONE_SAFETY_SETTINGS,
} from "./index.js";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

describe("isGeminiModel", () => {
  it("returns false for non-record values", () => {
    expect(isGeminiModel(null)).toBe(false);
    expect(isGeminiModel(undefined)).toBe(false);
    expect(isGeminiModel("string")).toBe(false);
    expect(isGeminiModel(42)).toBe(false);
    expect(isGeminiModel([])).toBe(false);
  });

  it("returns false when id/name do not include 'gemini'", () => {
    expect(isGeminiModel({ provider: "google" })).toBe(false);
    expect(isGeminiModel({ id: "gpt-4" })).toBe(false);
    expect(isGeminiModel({ name: "claude" })).toBe(false);
  });

  it("returns true when id includes 'gemini' and provider is google", () => {
    expect(isGeminiModel({ id: "gemini-1.5-pro", provider: "google" })).toBe(
      true
    );
  });

  it("returns true when name includes 'gemini' and api is google-generative-ai", () => {
    expect(
      isGeminiModel({ name: "gemini-1.5-flash", api: "google-generative-ai" })
    ).toBe(true);
  });

  it("returns true when name includes 'gemini' and api is google-vertex", () => {
    expect(
      isGeminiModel({ name: "gemini-1.5-flash", api: "google-vertex" })
    ).toBe(true);
  });

  it("returns true when name includes 'gemini' and api includes 'google'", () => {
    expect(
      isGeminiModel({ name: "gemini-1.5-flash", api: "google-ai" })
    ).toBe(true);
  });

  it("returns true when name includes 'gemini' and provider includes 'gemini'", () => {
    expect(isGeminiModel({ name: "gemini-1.5-flash", provider: "gemini" })).toBe(
      true
    );
  });

  it("returns false when name includes 'gemini' but no matching provider/api", () => {
    expect(isGeminiModel({ name: "gemini-1.5-flash", provider: "openai" })).toBe(
      false
    );
  });
});

describe("patchGeminiSafetySettings", () => {
  it("returns the original payload if it is not a record", () => {
    expect(patchGeminiSafetySettings(null)).toBe(null);
    expect(patchGeminiSafetySettings("string")).toBe("string");
    expect(patchGeminiSafetySettings(42)).toBe(42);
    expect(patchGeminiSafetySettings([])).toEqual([]);
  });

  it("returns a new object with safetySettings patched", () => {
    const payload = { contents: [{ role: "user", parts: [{ text: "hi" }] }] };
    const result = patchGeminiSafetySettings(payload);

    expect(result).toEqual({
      ...payload,
      safetySettings: GEMINI_BLOCK_NONE_SAFETY_SETTINGS,
    });
    expect(result).not.toBe(payload);
  });

  it("overwrites existing safetySettings", () => {
    const payload = {
      safetySettings: [{ category: "OLD", threshold: "BLOCK_LOW" }],
    };
    const result = patchGeminiSafetySettings(payload);

    expect(result).toEqual({
      ...payload,
      safetySettings: GEMINI_BLOCK_NONE_SAFETY_SETTINGS,
    });
  });
});

describe("geminiSafetyPatch", () => {
  it("registers a before_provider_request handler", () => {
    const on = vi.fn();
    const pi = { on } as unknown as ExtensionAPI;

    geminiSafetyPatch(pi);

    expect(on).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith(
      "before_provider_request",
      expect.any(Function)
    );
  });

  it("handler patches payload when model is Gemini", () => {
    const on = vi.fn();
    const pi = { on } as unknown as ExtensionAPI;

    geminiSafetyPatch(pi);

    const handler = on.mock.calls[0][1] as (
      event: { payload: unknown },
      ctx: { model: unknown }
    ) => unknown;

    const event = { payload: { contents: [] } };
    const ctx = { model: { id: "gemini-1.5-pro", provider: "google" } };

    const result = handler(event, ctx);

    expect(result).toEqual({
      contents: [],
      safetySettings: GEMINI_BLOCK_NONE_SAFETY_SETTINGS,
    });
  });

  it("handler returns undefined when model is not Gemini", () => {
    const on = vi.fn();
    const pi = { on } as unknown as ExtensionAPI;

    geminiSafetyPatch(pi);

    const handler = on.mock.calls[0][1] as (
      event: { payload: unknown },
      ctx: { model: unknown }
    ) => unknown;

    const event = { payload: { contents: [] } };
    const ctx = { model: { id: "gpt-4", provider: "openai" } };

    const result = handler(event, ctx);

    expect(result).toBeUndefined();
  });
});
