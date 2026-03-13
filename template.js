(function (globalScope) {
  const DEFAULT_SETTINGS = {
    approverName: "Ankur",
    releaseType: "HOT_FIX",
    appName: "PG",
    emailTo: "",
    ccList: "",
    subjectPrefix: "Deployment Approval",
    devOwners: "Vikram, Manish",
    qaOwners: "",
    phone: "+91 7821926893",
    senderName: "Manish Bachhav",
    signOffLine: "Thanks and Regards,",
    defaultReason: "",
    defaultSqlQueries: "Nil",
    defaultOtherRemarks: "Applications to Deploy:\n\nPG",
    versionByApp: {
      PG: "5.6.12"
    },
    versionMode: "manual"
  };

  function getTodayLabel() {
    const d = new Date();
    const month = d.toLocaleString("en-US", { month: "long" });
    return `${String(d.getDate()).padStart(2, "0")}-${month}-${d.getFullYear()}`;
  }

  function bumpSemver(version, mode) {
    const parts = (version || "0.0.0").split(".").map((x) => Number(x) || 0);
    while (parts.length < 3) parts.push(0);
    if (mode === "major") return `${parts[0] + 1}.0.0`;
    if (mode === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
    if (mode === "patch") return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    return version;
  }

  function esc(value) {
    return (value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function multilineToHtml(text) {
    return esc(text).replace(/\n/g, "<br>");
  }

  function buildEmail(payload) {
    const subject = `${payload.subjectPrefix} | ${payload.releaseType} v${payload.version} | ${payload.appName} | ${payload.date}`;

    const html = `
<div dir="ltr" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827">
  <div style="padding-top:16px">Hi <span style="font-size:small">${esc(payload.approverName)}</span></div>
  <div style="padding-top:16px">Kindly approve the deployment of the <span style="font-size:small">${esc(payload.releaseTypeLabel)}</span> for the '${esc(payload.appName)}' application.</div>
  <div style="padding-top:16px">Please find below details for the same:<br><br>
    <table border="0" cellspacing="0" cellpadding="0" width="567" style="font-size:14px;width:15cm;border-collapse:collapse">
      <tbody>
        <tr>
          <td colspan="2" style="background:rgb(13,31,99);padding:8px;text-align:center;color:#fff;font-weight:600">Release Template</td>
        </tr>
        ${buildRow("Release Type", `<b>${esc(payload.releaseType)}</b> <b>v</b> <b>${esc(payload.version)}</b>`)}
        ${buildRow("Application", `<b>${esc(payload.appName)}</b>`)}
        ${buildRow("Release scheduled date", `<b>${esc(payload.date)}</b>`)}
        ${buildRow("Reason of Change", multilineToHtml(payload.reason))}
        ${buildRow("Merge Request", payload.mergeRequests ? multilineToHtml(payload.mergeRequests) : "", true)}
        ${buildRow("SQL Queries", multilineToHtml(payload.sqlQueries || "Nil"))}
        ${buildRow("Dev Owner (s)", multilineToHtml(payload.devOwners || ""))}
        ${buildRow("QA Owner (s)", multilineToHtml(payload.qaOwners || ""))}
        ${buildRow("Other Remarks", multilineToHtml(payload.otherRemarks || ""))}
      </tbody>
    </table>
    <br>Please let us know for any further information.
  </div>
  <div style="padding-top:16px">
    <div>${esc(payload.signOffLine)}</div>
    <div>${esc(payload.senderName)},</div>
    <div>${esc(payload.phone)}</div>
  </div>
</div>`.trim();

    return {
      to: payload.emailTo,
      cc: payload.ccList,
      subject,
      html
    };
  }

  function buildRow(label, valueHtml, allowLink = false) {
    const processedValue = allowLink ? autoLink(valueHtml) : valueHtml;
    return `
    <tr>
      <td width="180" valign="top" style="background:rgb(13,31,99);color:#fff;padding:8px;border:1px solid #000">${esc(label)}</td>
      <td width="387" valign="top" style="padding:8px;border:1px solid #000">${processedValue || "&nbsp;"}</td>
    </tr>`;
  }

  function autoLink(html) {
    return html.replace(
      /(https?:\/\/[^\s<]+)/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
  }

  globalScope.ReleaseMailTemplate = {
    DEFAULT_SETTINGS,
    getTodayLabel,
    bumpSemver,
    buildEmail
  };
})(typeof window !== "undefined" ? window : self);
