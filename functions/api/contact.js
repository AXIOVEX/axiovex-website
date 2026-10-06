const START_MAILBOX = "start@axiovexsystems.com";
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_BODY_BYTES = 32768;
const MAX_MESSAGE_LENGTH = 5000;
const TOPICS = new Set(["New project", "Course & training", "Question"]);
const TEST_SECRET_KEYS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function htmlResponse({ ok, title, message }, status = 200) {
  const color = ok ? "#00DEF6" : "#FFB4AB";
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Axiovex Systems</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #081F32; color: #F7FCFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif; }
    main { width: min(620px, calc(100% - 48px)); border: 1px solid rgba(0,222,246,.25); border-radius: 14px; padding: 36px; background: rgba(247,252,255,.03); }
    h1 { margin-top: 0; font-size: 30px; line-height: 1.2; }
    p { color: rgba(247,252,255,.76); line-height: 1.65; }
    a { color: ${color}; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="/contact/">Return to the contact page</a> or email <a href="mailto:${START_MAILBOX}">${START_MAILBOX}</a>.</p>
  </main>
</body>
</html>`;
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function wantsJson(request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  return accept.includes("application/json") || contentType.includes("application/json");
}

function result(request, payload, status, html) {
  return wantsJson(request) ? jsonResponse(payload, status) : htmlResponse(html, status);
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function validEmail(value) {
  return value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

async function parseSubmission(request) {
  const contentType = request.headers.get("content-type") || "";
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return { error: "oversized" };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const form = await request.formData();
      const data = {};
      let size = 0;
      for (const [key, value] of form.entries()) {
        if (typeof value !== "string") return { error: "invalid" };
        size += key.length + value.length;
        if (size > MAX_BODY_BYTES) return { error: "oversized" };
        data[key] = value;
      }
      return { data };
    } catch {
      return { error: "invalid" };
    }
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return { error: "oversized" };
  }
  if (!raw) return { data: {} };

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw);
      return { data: parsed && typeof parsed === "object" ? parsed : {} };
    } catch {
      return { error: "invalid" };
    }
  }

  return { error: "unsupported" };
}

function validateSubmission(data) {
  const submission = {
    name: cleanText(data.name, 100),
    email: cleanText(data.email, 254),
    company: cleanText(data.company, 120),
    topic: cleanText(data.topic, 80),
    message: cleanText(data.message, MAX_MESSAGE_LENGTH),
    token: typeof data["cf-turnstile-response"] === "string" ? data["cf-turnstile-response"].trim() : "",
    honeypot: typeof data.website === "string" ? data.website.trim() : "",
    startedAt: Number(data.startedAt || 0),
  };
  const errors = {};

  if (!submission.name) errors.name = "Please enter your name.";
  if (!submission.email) errors.email = "Please enter your email address.";
  else if (!validEmail(submission.email)) errors.email = "Please enter a valid email address.";
  if (!TOPICS.has(submission.topic)) errors.topic = "Please choose a topic.";
  if (!submission.message) errors.message = "Please enter a message.";
  if (!submission.token) {
    errors.turnstile = "Please complete the spam check. If it does not appear, email us instead.";
  }

  return { submission, errors };
}

async function verifyTurnstile({ env, request, token }) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return { ok: false, configuration: true };
  }

  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.append("remoteip", remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false };
    const data = await response.json();

    if (data.success !== true) return { ok: false };

    // Cloudflare's published testing secrets return a testing marker,
    // hostname "example.com", and no action. Those keys exist only in the
    // Preview environment; production secrets cannot produce this result.
    const isTestingResult = data.metadata?.result_with_testing_key === true;
    if (isTestingResult && TEST_SECRET_KEYS.has(env.TURNSTILE_SECRET_KEY)) {
      return data.hostname === "example.com" ? { ok: true } : { ok: false };
    }

    if (data.hostname !== "axiovexsystems.com") return { ok: false };
    if (data.action !== "contact") return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function getGraphToken(env) {
  const required = [env.GRAPH_TENANT_ID, env.GRAPH_CLIENT_ID, env.GRAPH_CLIENT_SECRET];
  if (required.some((value) => !value)) return null;

  const body = new URLSearchParams({
    client_id: env.GRAPH_CLIENT_ID,
    client_secret: env.GRAPH_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(env.GRAPH_TENANT_ID)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function deliverMessage(env, submission) {
  const accessToken = await getGraphToken(env);
  if (!accessToken) return false;

  const subjectPrefix = env.ENVIRONMENT === "staging" ? "[staging] " : "";
  const subject = `${subjectPrefix}Website contact: ${submission.topic} - ${submission.name}`.replace(/[\r\n]+/g, " ");
  const content = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Company: ${submission.company || "(not provided)"}`,
    `Topic: ${submission.topic}`,
    "",
    submission.message,
  ].join("\n");

  const payload = {
    message: {
      subject,
      body: { contentType: "text", content },
      toRecipients: [{ emailAddress: { address: START_MAILBOX } }],
      replyTo: [
        {
          emailAddress: {
            address: submission.email,
            name: submission.name.replace(/[\r\n]+/g, " "),
          },
        },
      ],
    },
    saveToSentItems: false,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(START_MAILBOX)}/sendMail`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );
    if (response.status !== 202) {
      console.error(`Graph sendMail failed with status ${response.status}`);
      return false;
    }
    return true;
  } catch {
    console.error("Graph sendMail request failed");
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return result(
      request,
      { ok: false, message: "Method not allowed." },
      405,
      {
        ok: false,
        title: "Method not allowed",
        message: "This endpoint only accepts contact-form submissions.",
      },
    );
  }

  const parsed = await parseSubmission(request);
  if (parsed.error === "oversized") {
    return result(
      request,
      { ok: false, message: "Your submission is too large. Please shorten it or email us instead." },
      413,
      {
        ok: false,
        title: "Submission too large",
        message: "Please shorten your message or email us instead.",
      },
    );
  }
  if (parsed.error) {
    return result(
      request,
      { ok: false, message: "We could not read that submission. Please try again or email us instead." },
      400,
      {
        ok: false,
        title: "Submission not sent",
        message: "We could not read that submission. Please try again or email us instead.",
      },
    );
  }

  const { submission, errors } = validateSubmission(parsed.data);

  // Bots that fill the honeypot (or submit implausibly fast) get an
  // apparent success, but nothing is verified or delivered.
  const submittedTooFast =
    Number.isFinite(submission.startedAt) &&
    submission.startedAt > 0 &&
    Date.now() - submission.startedAt < 2000;
  if (submission.honeypot || submittedTooFast) {
    return result(
      request,
      { ok: true, message: "Message sent. A founder will reply." },
      200,
      {
        ok: true,
        title: "Message sent",
        message: "Thank you. A founder will reply.",
      },
    );
  }

  if (Object.keys(errors).length > 0) {
    return result(
      request,
      {
        ok: false,
        message: "Please check the highlighted fields and try again.",
        errors,
      },
      422,
      {
        ok: false,
        title: "Please check your message",
        message: "A required field is missing or invalid. Return to the contact page and try again, or email us instead.",
      },
    );
  }

  const verification = await verifyTurnstile({ env, request, token: submission.token });
  if (!verification.ok) {
    const message = verification.configuration
      ? "The contact form is not configured correctly. Please email us instead."
      : "The spam check could not verify this submission. Please try again or email us instead.";
    return result(
      request,
      { ok: false, message, errors: { turnstile: message }, resetTurnstile: true },
      verification.configuration ? 500 : 403,
      { ok: false, title: "Message not sent", message },
    );
  }

  const delivered = await deliverMessage(env, submission);
  if (!delivered) {
    const message = "We could not deliver your message right now. Please try again or email us instead.";
    return result(
      request,
      { ok: false, message, resetTurnstile: true },
      502,
      { ok: false, title: "Message not sent", message },
    );
  }

  return result(
    request,
    { ok: true, message: "Message sent. A founder will reply." },
    200,
    {
      ok: true,
      title: "Message sent",
      message: "Thank you. A founder will reply.",
    },
  );
}
