---
slug: streaming-ai-responses-laravel-ressonance
title: Streaming AI Responses with Laravel and Ressonance
authors: [jlemos]
tags: [laravel, php, ai, websockets, ressonance]
date: 2026-08-15
description: Stream Laravel AI's token-by-token output over a WebSocket with Laravel Echo and Ressonance, and render it live in the browser.
keywords:
  - laravel ai streaming
  - stream ai responses websocket
  - laravel echo reverb ai
  - ressonance websocket laravel
---

Token-by-token AI output — the little "typing" effect you get from ChatGPT — isn't a nice-to-have anymore, it's the expected UX for anything that talks to an LLM. And the wrong way to build it is polling an endpoint every few hundred milliseconds hoping the next chunk is ready.

The demo is a Laravel application using Ressonance but this can be achieved with any other language or any other reverb/pusher compatible websocket provider.

## Prerequisites

- A Laravel app with [Laravel AI](https://github.com/laravel/ai) installed and at least one provider configured in `config/ai.php` (OpenAI, Anthropic, Ollama — any of them work, streaming isn't provider-specific).
- A free [Ressonance](https://www.ressonance.com) app (it's a drop-in Pusher-protocol replacement, so setup is just grabbing your app key/secret/host).

---

## Step 1 — Point broadcasting at Ressonance

Ressonance speaks the same protocol as Laravel Reverb, so there's no new driver to install — you configure the `reverb` connection in `config/broadcasting.php` and point it at Ressonance's host instead of your own server:

```php
'reverb' => [
    'driver' => 'reverb',
    'key' => env('REVERB_APP_KEY'),
    'secret' => env('REVERB_APP_SECRET'),
    'app_id' => env('REVERB_APP_ID'),
    'options' => [
        'host' => env('REVERB_HOST'),
        'port' => env('REVERB_PORT', 443),
        'scheme' => env('REVERB_SCHEME', 'https'),
        'useTLS' => env('REVERB_SCHEME', 'https') === 'https',
    ],
],
```

And in `.env`, use the credentials from your Ressonance app dashboard:

```
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST="your-app.ressonance.com"
REVERB_PORT=443
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

That's the entire backend infrastructure setup. No server to provision, no process to keep alive.

---

## Step 2 — Install and configure Laravel Echo

```bash
npm install --save-dev laravel-echo pusher-js
```

Create `resources/js/echo.js`:

```js
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

Then import it from your main entry point, `resources/js/app.js`:

```js
import './echo';
```

### Why `pusher-js` if we're not using Pusher?

Ressonance and Reverb both implement the Pusher protocol, and `laravel-echo`'s `reverb` broadcaster is built on top of the `pusher-js` client under the hood. You never talk to Pusher's servers — the `wsHost` config is what actually decides where the socket connects.

---

## Step 3 — Broadcast AI tokens as they're generated

Laravel AI's `agent()->stream()` yields a sequence of stream events as the model responds. Each token arrives as a `TextDelta` event, and it exposes a `broadcast()` method — hand it a channel and it goes straight out over the wire:

```php
use Illuminate\Broadcasting\Channel;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Streaming\Events\TextDelta;

use function Laravel\Ai\agent;

class TestingController extends Controller
{
    public function index()
    {
        $stream = agent()->stream('Tell me a short story', provider: Lab::Ollama);

        foreach ($stream as $event) {
            if ($event instanceof TextDelta) {
                $event->broadcast(new Channel('new-text-delta'));
            }
        }

        return '';
    }
}
```

### Why check `instanceof TextDelta`?

A stream isn't only text — depending on what the agent is doing, you can also get events for tool calls, message boundaries, and so on. Filtering to `TextDelta` means you only broadcast the actual token chunks, not the plumbing around them.

---

## Step 4 — Listen for tokens in the browser

First, make sure the compiled assets are actually loaded — add `@vite` to your view's `<head>`:

```blade
@vite('resources/js/app.js')
```

Then drop a text area to render into, and listen on the same channel you broadcast to:

```blade
<textarea id="stream-output" rows="20" readonly></textarea>

<script>
    document.addEventListener("DOMContentLoaded", () => {
        const streamOutput = document.getElementById('stream-output');

        Echo.channel('new-text-delta')
            .listen('.text_delta', (e) => {
                streamOutput.value += e.delta;
        });
    });
</script>
```

### Why the leading dot in `.text_delta`?

`TextDelta::broadcast()` sets a custom event name (`text_delta`) instead of relying on Laravel's default namespaced event name. Echo assumes any event name is namespaced under `App.Events` unless you tell it otherwise — the leading dot says "this is a raw event name, don't prefix it." Without it, Echo listens for an event that never arrives.

## Why hand this off to Ressonance

Everything above works exactly the same way against a self-hosted Reverb server — Ressonance doesn't change a line of the code. What it removes is running that server yourself: no process to keep alive, no scaling it when concurrent streams spike, no TLS termination to configure. Since it speaks the same Pusher protocol Echo already expects, swapping in Ressonance is a config change, not a rewrite.

If you're already prototyping AI streaming locally and want it production-ready without standing up your own WebSocket infrastructure, [Ressonance](https://www.ressonance.com) is built for exactly this.
