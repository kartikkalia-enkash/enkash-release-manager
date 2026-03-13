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
    throw new Error("Could not find Gmail compose button.");
  }
  composeButton.click();

  const draftRoot = await waitFor(() => document.querySelector('div[role="dialog"]'));
  const toInput = draftRoot.querySelector('textarea[name="to"], input[aria-label^="To"]');
  if (toInput) {
    setInputValue(toInput, to);
    toInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  }

  if (cc) {
    const ccToggle = draftRoot.querySelector('span[role="link"][data-tooltip="Add Cc recipients"]');
    if (ccToggle) ccToggle.click();
    const ccInput = await waitFor(() => draftRoot.querySelector('textarea[name="cc"], input[aria-label^="Cc"]'));
    setInputValue(ccInput, cc);
    ccInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  }

  const subjectInput = await waitFor(() => draftRoot.querySelector('input[name="subjectbox"]'));
  setInputValue(subjectInput, subject);

  const body = await waitFor(() => draftRoot.querySelector('div[aria-label="Message Body"]'));
  body.focus();
  body.innerHTML = html;
  body.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

function setInputValue(input, value) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function waitFor(getter, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = getter();
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Timed out while waiting for Gmail composer element.");
}
