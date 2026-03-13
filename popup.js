const { DEFAULT_SETTINGS, getTodayLabel, bumpSemver, buildEmail } = ReleaseMailTemplate;

const form = document.getElementById("mail-form");
const statusEl = document.getElementById("status");
const saveDefaultsBtn = document.getElementById("save-defaults");

init().catch((err) => setStatus(err.message, true));

async function init() {
  const { settings = DEFAULT_SETTINGS } = await chrome.storage.sync.get("settings");
  fillForm(settings);
}

function fillForm(settings) {
  const appName = settings.appName || DEFAULT_SETTINGS.appName;
  const version = (settings.versionByApp && settings.versionByApp[appName]) || "";
  const data = {
    ...DEFAULT_SETTINGS,
    ...settings,
    date: getTodayLabel(),
    version,
    reason: settings.defaultReason || "",
    sqlQueries: settings.defaultSqlQueries || "Nil",
    otherRemarks: settings.defaultOtherRemarks || "",
    mergeRequests: ""
  };

  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function collectForm() {
  const get = (name) => form.elements.namedItem(name)?.value?.trim() || "";
  const appName = get("appName");
  let version = get("version");
  const bumpMode = get("versionBump");
  if (bumpMode !== "none") version = bumpSemver(version, bumpMode);

  return {
    emailTo: get("emailTo"),
    ccList: get("ccList"),
    approverName: get("approverName"),
    releaseType: get("releaseType"),
    releaseTypeLabel: get("releaseType").replace("_", "-"),
    appName,
    version,
    date: get("date") || getTodayLabel(),
    reason: get("reason"),
    mergeRequests: get("mergeRequests"),
    sqlQueries: get("sqlQueries"),
    devOwners: get("devOwners"),
    qaOwners: get("qaOwners"),
    otherRemarks: get("otherRemarks"),
    senderName: get("senderName"),
    phone: get("phone"),
    signOffLine: DEFAULT_SETTINGS.signOffLine,
    subjectPrefix: get("subjectPrefix"),
    bumpMode
  };
}

saveDefaultsBtn.addEventListener("click", async () => {
  const payload = collectForm();
  const { settings = DEFAULT_SETTINGS } = await chrome.storage.sync.get("settings");
  const versionByApp = { ...(settings.versionByApp || {}), [payload.appName]: payload.version };

  const newSettings = {
    ...settings,
    approverName: payload.approverName,
    releaseType: payload.releaseType,
    appName: payload.appName,
    emailTo: payload.emailTo,
    ccList: payload.ccList,
    subjectPrefix: payload.subjectPrefix,
    devOwners: payload.devOwners,
    qaOwners: payload.qaOwners,
    phone: payload.phone,
    senderName: payload.senderName,
    defaultReason: payload.reason,
    defaultSqlQueries: payload.sqlQueries,
    defaultOtherRemarks: payload.otherRemarks,
    versionByApp
  };

  await chrome.storage.sync.set({ settings: newSettings });
  setStatus("Defaults saved.");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = collectForm();
  const draft = buildEmail(payload);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url?.includes("mail.google.com")) {
    setStatus("Open Gmail tab first, then click extension.", true);
    return;
  }

  await chrome.tabs.sendMessage(tab.id, { type: "CREATE_GMAIL_DRAFT", payload: draft });

  const { settings = DEFAULT_SETTINGS } = await chrome.storage.sync.get("settings");
  const versionByApp = { ...(settings.versionByApp || {}), [payload.appName]: payload.version };
  await chrome.storage.sync.set({ settings: { ...settings, versionByApp } });
  setStatus(`Draft created with version ${payload.version}`);
});

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#15803d";
}
