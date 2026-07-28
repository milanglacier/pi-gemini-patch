# pi Gemini Safety Patch

Project-local pi extension that patches Google/Gemini provider requests so all Gemini safety categories use `BLOCK_NONE`.

## Behavior

When the active model is a Gemini model on a Google/Gemini provider, the extension rewrites the outgoing provider payload to include:

```json
{
  "config": {
    "safetySettings": [
      { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "BLOCK_NONE" }
    ]
  }
}
```

OpenRouter Gemini models are excluded because they use OpenAI-compatible requests.

## Rationale

Pi's `before_provider_request` hook runs after the Google provider builds a
`GenerateContentParameters` object for `@google/genai`. In that object,
`safetySettings` is a property of `config`, not a top-level request property.
The Google SDK silently ignores unknown top-level fields while serializing the
request, so placing it at the top level makes the patch appear to work in
unit tests but omits it from the actual HTTP request. The extension therefore
merges the settings into the existing `config` object, preserving other
provider options such as temperature, tools, and thinking configuration.

`BLOCK_NONE` changes Gemini's API safety-filter threshold; it does not remove
the model's own refusal behavior or other platform-level safeguards.

There is intentionally no toggle: if the extension is loaded, the patch applies automatically to matching Gemini requests.

## Requirements

- [pi](https://pi.dev) (the `@earendil-works/pi-coding-agent` package is a peer dependency)

## License

MIT
