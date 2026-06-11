import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const BLOCK_NONE_THRESHOLD = "BLOCK_NONE";

const GEMINI_HARM_CATEGORIES = [
	"HARM_CATEGORY_HARASSMENT",
	"HARM_CATEGORY_HATE_SPEECH",
	"HARM_CATEGORY_SEXUALLY_EXPLICIT",
	"HARM_CATEGORY_DANGEROUS_CONTENT",
	"HARM_CATEGORY_CIVIC_INTEGRITY",
] as const;

export const GEMINI_BLOCK_NONE_SAFETY_SETTINGS = GEMINI_HARM_CATEGORIES.map((category) => ({
	category,
	threshold: BLOCK_NONE_THRESHOLD,
}));

type UnknownRecord = Record<string, unknown>;

type ModelLike = {
	provider?: unknown;
	id?: unknown;
	name?: unknown;
	api?: unknown;
};

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value: unknown): string {
	return typeof value === "string" ? value.toLowerCase() : "";
}

export function isGeminiModel(model: unknown): boolean {
	if (!isRecord(model)) return false;

	const candidate = model as ModelLike;
	const provider = normalize(candidate.provider);
	const id = normalize(candidate.id);
	const name = normalize(candidate.name);
	const api = normalize(candidate.api);

	const isGeminiModel = id.includes("gemini") || name.includes("gemini");
	if (!isGeminiModel) return false;

	return (
		api === "google-generative-ai" ||
		api === "google-vertex" ||
		api.includes("google") ||
		provider === "google" ||
		provider === "google-vertex" ||
		provider.includes("gemini")
	);
}

export function patchGeminiSafetySettings(payload: unknown): unknown {
	if (!isRecord(payload)) return payload;

	return {
		...payload,
		safetySettings: GEMINI_BLOCK_NONE_SAFETY_SETTINGS,
	};
}

export default function geminiSafetyPatch(pi: ExtensionAPI) {
	pi.on("before_provider_request", (event, ctx) => {
		const activeModel = (ctx as { model?: unknown }).model;

		if (isGeminiModel(activeModel)) {
			return patchGeminiSafetySettings(event.payload);
		}
	});
}
