---
slug: laravel-websockets-tutorial
title: Building a Real-Time Dashboard with Laravel and WebSockets
authors: [vtrgomes]
tags: [laravel, php, real-time, websockets, open source]
date: 2026-01-21
---

Real-time features are no longer a “nice to have.” Dashboards, notifications, live metrics, and collaborative tools are now expected behaviors in modern applications.

As Laravel developers, we’re in a great position: the ecosystem offers **first-class support for WebSockets** through Laravel Echo and Reverb. Still, many tutorials stop at theory or overused chat examples.

In this **Laravel WebSockets tutorial**, I want to share a practical, production-adjacent example: **a real-time dashboard that updates totals instantly**, without polling, using Echo and Reverb.

This is a hands-on guide aimed at developers who want to *understand how WebSockets actually work in Laravel*, not just copy-paste code.

<!-- truncate -->

---

## Why a Real-Time Dashboard (and Not a Chat)

Chat applications are the “Hello World” of WebSockets — and that’s exactly the problem.

In real-world SaaS products, WebSockets are far more commonly used for:
- live dashboards
- notifications
- metrics
- status updates
- operational monitoring

A **real-time dashboard**:
- maps directly to real product use cases
- avoids unnecessary UI complexity
- highlights event broadcasting clearly
- scales naturally to multiple connected clients

That’s why we’ll build a **simple totals dashboard** instead.

---

## Architecture Overview: Echo + Reverb

Here’s the stack we’ll use:

- **Laravel Reverb** → WebSocket server  
- **Laravel Broadcasting** → event distribution  
- **Laravel Echo** → JavaScript client  
- **Public channels** → simplest possible setup  

No external services. No polling. No magic.

---

## Step 1: Creating a Simple Real-Time Totals Dashboard

Our dashboard will display a few aggregated values, for example:
- Total sales
- Orders today
- Active users
- Open tickets

The UI itself is intentionally minimal; the focus is the **real-time data flow**, not design.

At page load, Laravel renders the initial values. From that point on, updates happen exclusively via WebSockets.

Let’s get started by creating your Laravel project and installing the tools we need.

```sh
curl -s https://laravel.build/laravel-websockets-tutorial | bash
```

Now, go to your project path and install the dependencies:

**Note:** We’re using [Sail](https://laravel.com/docs/12.x/sail) in this tutorial. If you already have PHP and Composer installed, just run the `composer install` command.

```sh
docker run --rm   
  -u "$(id -u):$(id -g)"   
  -v "$(pwd):/var/www/html"   
  -w /var/www/html   
  laravelsail/php84-composer:latest   
  composer install 
  --ignore-platform-reqs
```

Now, let’s install our tools:

```sh
sail composer require laravel/reverb
sail artisan reverb:install
```

Finally, add the following content to your `.env` file:

```sh
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=local
REVERB_APP_KEY=local
REVERB_APP_SECRET=local
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

Now we have our tools installed. Let’s start coding.

---

## Step 2: Broadcasting Updates with Laravel Events

In Laravel, real-time updates start with **events**.

We create an event that implements broadcasting and sends the updated totals to a channel:

```sh
sail artisan make:event DashboardTotalsUpdated
```

And paste the following code:

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardTotalsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public array $totals;

    public function __construct(array $totals)
    {
        $this->totals = $totals;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('dashboard.totals');
    }

    public function broadcastAs(): string
    {
        return 'totals.updated';
    }
}
```

### Why `ShouldBroadcastNow`?

This is an important learning moment.

By default, broadcast events may be queued. If you don’t have a queue worker running, **events are silently never delivered** — one of the most common pitfalls when starting with WebSockets.

Using `ShouldBroadcastNow` ensures:
- immediate delivery
- zero queue configuration
- fewer moving parts for learning

For production systems, queued broadcasting is often preferred, but for a tutorial, this approach is fine.

---

Now, we’ll create a service store, just for clarity:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class DashboardTotalsStore
{
    private const KEY = 'dashboard_totals';

    public function get(): array
    {
        return Cache::get(self::KEY, [
            'sales_total' => 1200,
            'orders_today' => 18,
            'active_users' => 7,
            'tickets_open' => 3,
        ]);
    }

    public function update(array $totals): array
    {
        Cache::forever(self::KEY, $totals);
        return $totals;
    }

    public function increment(string $key, int $by = 1): array
    {
        $totals = $this->get();

        if (!array_key_exists($key, $totals)) {
            $totals[$key] = 0;
        }

        $totals[$key] += $by;

        return $this->update($totals);
    }
}
```

Then, the controller:

```sh
sail artisan make:controller DashboardController
```

With the following content:

```php
<?php

namespace App\Http\Controllers;

use App\Events\DashboardTotalsUpdated;
use App\Services\DashboardTotalsStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(DashboardTotalsStore $store): View
    {
        return view('dashboard', [
            'totals' => $store->get(),
        ]);
    }

    public function simulate(Request $request, DashboardTotalsStore $store): JsonResponse
    {
        $key = $request->string('key', 'orders_today')->toString();
        $by  = (int) $request->input('by', 1);

        $totals = $store->increment($key, $by);

        broadcast(new DashboardTotalsUpdated($totals));

        return response()->json([
            'ok' => true,
            'totals' => $totals,
        ]);
    }
}
```

Our routes:

```php
use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index']);
Route::post('/simulate', [DashboardController::class, 'simulate']);
```

---

## Step 3: Listening to Events with Laravel Echo

On the frontend, we create a simple view to use Laravel Echo. The main idea is to subscribe to the channel and listen for updates. Let’s install it:

```sh
npm install laravel-echo
```

```php
## resources/views/dashboard.blade.php
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Real-Time Totals Dashboard</title>
  @vite(['resources/js/app.js'])
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .card { border: 1px solid #eee; border-radius: 12px; padding: 16px; }
    .label { font-size: 12px; opacity: .7; margin-bottom: 8px; }
    .value { font-size: 28px; font-weight: 700; }
    .controls { margin-top: 20px; display: flex; gap: 8px; flex-wrap: wrap; }
    button { padding: 10px 12px; border-radius: 10px; border: 1px solid #ddd; background: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Real-Time Totals Dashboard</h1>

  <div class="grid">
    <div class="card">
      <div class="label">Sales Total</div>
      <div class="value" id="sales_total">{{ $totals['sales_total'] }}</div>
    </div>
    <div class="card">
      <div class="label">Orders Today</div>
      <div class="value" id="orders_today">{{ $totals['orders_today'] }}</div>
    </div>
    <div class="card">
      <div class="label">Active Users</div>
      <div class="value" id="active_users">{{ $totals['active_users'] }}</div>
    </div>
    <div class="card">
      <div class="label">Tickets Open</div>
      <div class="value" id="tickets_open">{{ $totals['tickets_open'] }}</div>
    </div>
  </div>

  <div class="controls">
    <button onclick="window.simulate('orders_today', 1)">+1 Order</button>
    <button onclick="window.simulate('sales_total', 50)">+R$50 Sales</button>
    <button onclick="window.simulate('active_users', 1)">+1 Active User</button>
    <button onclick="window.simulate('tickets_open', 1)">+1 Ticket</button>
  </div>
</body>
</html>
```

```js
// resources/js/app.js
import './bootstrap';
import Echo from 'laravel-echo';

window.Echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
});

function updateTotals(totals) {
  for (const [key, value] of Object.entries(totals)) {
    const el = document.getElementById(key);
    if (el) el.textContent = value;
  }
}

window.simulate = async (key, by) => {
  await fetch('/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
    },
    body: JSON.stringify({ key, by }),
  });
};

window.Echo
  .channel('dashboard.totals')
  .listen('.totals.updated', (e) => {
    updateTotals(e.totals);
  });
```

Of course, you need to run:

```sh
npm run dev
```

Once connected:
- any client on the page receives updates
- multiple tabs update simultaneously
- no refresh required

If you see `WS connected` in your console, your real-time pipeline is alive.

---

## Common Pitfalls When Using Reverb

If you’ve ever thought “WebSockets are flaky,” chances are you hit one of these:

### 1. WebSocket connected, but no events
Usually caused by:
- queued broadcasts without a worker
- mismatched event names
- listening on the wrong channel

### 2. Works locally, breaks in Docker
Often related to:
- unexposed ports
- incorrect host configuration
- container vs. host networking

These issues are not bugs — they’re **operational complexity**.

---

## From Local Development to Production Reality

Laravel Reverb is excellent for:
- learning WebSockets
- local development
- small internal tools

But as soon as you move to production, new challenges appear:
- scaling concurrent connections
- reconnect logic
- TLS and certificates
- zero-downtime deploys
- observability and metrics
- multi-region latency
- infrastructure maintenance

At this point, many teams realize that **self-hosting WebSockets is no longer just “code” — it’s infrastructure**.

---

## Conclusion

In this **Laravel WebSockets tutorial**, we built a real-time dashboard using Echo and Reverb, without polling and without external dependencies.

This approach is perfect for learning and experimenting.

However, if you’re going to run it in production, you’ll need to start paying attention to:

- connection pooling
- ports
- horizontal scaling
- DDoS protection
- number of concurrent connections

That’s exactly why we built **Ressonance**. You write the code; we take care of WebSockets. Simple as that.

Ressonance is a **WebSocket-as-a-Service platform**, designed for developers, with:
- a generous **free tier**
- Laravel-first experience
- cloud-hosted infrastructure
- zero operational overhead

[Create your free Ressonance account and focus on building features, not infrastructure](https://ressonance.com)

Real-time should feel simple again.
