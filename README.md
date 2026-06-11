# pi Gemini Safety Patch

Project-local pi extension that patches Google/Gemini provider requests so all Gemini safety categories use `BLOCK_NONE`.

## Behavior

When the active model is a Gemini model on a Google/Gemini provider, the extension rewrites the outgoing provider payload to include:

```json
"safetySettings": [
  { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "BLOCK_NONE" }
]
```

OpenRouter Gemini models are excluded because they use OpenAI-compatible requests.

There is intentionally no toggle: if the extension is loaded, the patch applies automatically to matching Gemini requests.

## Requirements

- [pi](https://pi.dev) (the `@earendil-works/pi-coding-agent` package is a peer dependency)

## License

MIT
