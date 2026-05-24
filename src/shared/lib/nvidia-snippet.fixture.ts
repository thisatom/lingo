/** NVIDIA catalog axios example (no real secrets). */
export const NVIDIA_AXIOS_SNIPPET = `import axios from 'axios';

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const stream = true;

const headers = {
  "Authorization": "Bearer nvapi-test-key",
  "Accept": stream ? "text/event-stream" : "application/json"
};

const payload = {
  "model": "google/gemma-3n-e2b-it",
  "messages": [{"role":"user","content":""}],
  "max_tokens": 512,
  "temperature": 0.20,
  "top_p": 0.70,
  "frequency_penalty": 0.00,
  "presence_penalty": 0.00,
  "stream": stream
};

axios.post(invokeUrl, payload, { headers });
`

/** Same pattern with stream variable set to false — must not become true. */
export const NVIDIA_AXIOS_SNIPPET_NO_STREAM = `const stream = false;
const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const payload = {
  "model": "google/gemma-3n-e2b-it",
  "stream": stream
};
`
