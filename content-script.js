chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CREATE_GMAIL_DRAFT") return;

  createDraft(message.payload)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  return true;
});

async function createDraft({ to, cc, subject, html }) {
  const composeButton = document.querySelector('div[gh="cm"]');
  if (!composeButton) {
    throw new Error("Could not find Gmail compose button. Please open inbox view first.");
  }

  composeButton.click();
  const draftRoot = await waitForComposeDialog();

  await fillRecipients(draftRoot, to, "to");
  if (cc) {
    await revealCc(draftRoot);
    await fillRecipients(draftRoot, cc, "cc");
  }

  const subjectInput = await waitFor(() => draftRoot.querySelector('input[name="subjectbox"]'));
  setNativeInputValue(subjectInput, subject);

  const body = await waitFor(() => draftRoot.querySelector('div[aria-label="Message Body"][contenteditable="true"]'));
  body.focus();
  body.innerHTML = "";
  document.execCommand("insertHTML", false, html);
  body.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

async function revealCc(draftRoot) {
  const ccToggle =
    draftRoot.querySelector('span[role="link"][data-tooltip*="Cc"]') ||
    draftRoot.querySelector('span[role="link"][data-tooltip*="CC"]') ||
    draftRoot.querySelector('span[role="link"][data-tooltip*="recipients"]');

  if (ccToggle) ccToggle.click();
  await waitFor(() => findRecipientField(draftRoot, "cc"));
}

async function fillRecipients(draftRoot, recipientsRaw, type) {
  const recipients = (recipientsRaw || "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  if (!recipients.length) return;

  const field = await waitFor(() => findRecipientField(draftRoot, type));
  field.focus();

  for (const recipient of recipients) {
    typeInContentEditable(field, recipient);
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    field.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true }));
    await sleep(80);
  }
}

function findRecipientField(root, type) {
  const labels = type === "to" ? ["To recipients", "To"] : ["Cc recipients", "Cc", "CC"];

  for (const label of labels) {
    const byAria = root.querySelector(`input[aria-label*="${label}"], div[aria-label*="${label}"][contenteditable="true"]`);
    if (byAria) return byAria;
  }

  const byName = root.querySelector(`textarea[name="${type}"], input[name="${type}"]`);
  if (byName) return byName;

  return null;
}

function typeInContentEditable(el, value) {
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    setNativeInputValue(el, value);
    return;
  }

  el.textContent = value;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, data: value }));
}

function setNativeInputValue(input, value) {
  input.focus();
  const setter = Object.getOwnPropertyDescriptor(input.__proto__, "value")?.set;
  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function waitForComposeDialog(timeoutMs = 10000) {
  return waitFor(() => {
    const dialogs = [...document.querySelectorAll('div[role="dialog"]')];
    return dialogs.find((d) => d.querySelector('input[name="subjectbox"]')) || null;
  }, timeoutMs);
}

async function waitFor(getter, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = getter();
    if (found) return found;
    await sleep(150);
  }
  throw new Error("Timed out while waiting for Gmail composer element.");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
