const RIPER_PHASE_ORDER = Object.freeze({
  Research: 0,
  Innovate: 1,
  Plan: 2,
  Execute: 3,
  Review: 4
});

function readField(content, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.match(new RegExp(`^- \\*\\*${escapedLabel}\\*\\*: (.+)$`, "m"))?.[1]?.trim() || "";
}

function readSection(content, heading) {
  const start = content.indexOf(`${heading}\n`);
  if (start === -1) return "";
  const bodyStart = start + heading.length + 1;
  const next = content.indexOf("\n## ", bodyStart);
  return content.slice(bodyStart, next === -1 ? content.length : next);
}

function hasIncompleteMarker(value) {
  return /\bTBD\b|\bpending\b/i.test(value);
}

export function readSpecProjection(content) {
  const versionValue = readField(content, "Workflow Version");
  const version = versionValue === "" ? 0 : Number(versionValue);
  return Object.freeze({
    deliveryStatus: readField(content, "Delivery Status"),
    riperPhase: readField(content, "RIPER Phase"),
    approvalStatus: readField(content, "Approval Status"),
    owner: readField(content, "Owner"),
    overallVerdict: readField(content, "Overall Verdict"),
    version,
    requirements: readSection(content, "## 1. Requirements (Context)"),
    plan: readSection(content, "## 4. Plan (Contract)"),
    executeLog: readSection(content, "## 5. Execute Log"),
    validation: readSection(content, "## 6. Validation & Review Verdict"),
    handoff: readSection(content, "## 8. Change Log & Handoff")
  });
}

export function validateSpecPolicy(projection, sourceState, targetState) {
  const failures = [];
  if (projection.deliveryStatus !== sourceState) {
    failures.push(`Delivery Status '${projection.deliveryStatus || "missing"}' does not match directory '${sourceState}'.`);
  }
  if (!Number.isInteger(projection.version) || projection.version < 0) {
    failures.push("Workflow Version must be a non-negative integer.");
  }

  if (sourceState === "draft" && targetState === "ready") {
    const phaseRank = RIPER_PHASE_ORDER[projection.riperPhase];
    if (!projection.owner || hasIncompleteMarker(projection.owner)) failures.push("Owner must be complete.");
    if (phaseRank === undefined || phaseRank < RIPER_PHASE_ORDER.Plan) failures.push("RIPER Phase must have reached Plan.");
    if (projection.approvalStatus !== "Plan Approved") failures.push("Approval Status must be exactly 'Plan Approved'.");
    if (!projection.requirements || hasIncompleteMarker(projection.requirements) || !projection.requirements.includes("### Acceptance Criteria")) {
      failures.push("Requirements and acceptance criteria must be complete.");
    }
    if (!projection.plan || hasIncompleteMarker(projection.plan) || !projection.plan.includes("### 4.1 File Changes") || !projection.plan.includes("### 4.2 Signatures") || !projection.plan.includes("### 4.3 Implementation Checklist")) {
      failures.push("Plan file changes, signatures, and checklist must be complete.");
    }
  }

  if (sourceState === "ready" && targetState === "done") {
    if (projection.riperPhase !== "Review") failures.push("RIPER Phase must be Review.");
    if (!projection.executeLog || projection.executeLog.includes("- [ ]")) failures.push("Execute Log must have no incomplete checklist items.");
    if (!projection.validation || hasIncompleteMarker(projection.validation)) failures.push("Validation evidence and Review fields must be complete.");
    if (!/Reviewer Notes:\s*(?!pending|TBD)\S+/i.test(projection.validation)) failures.push("Reviewer Notes must be complete.");
    if (projection.overallVerdict !== "PASS") failures.push("Overall Verdict must be PASS.");
    if (!projection.handoff || hasIncompleteMarker(projection.handoff)) failures.push("Handoff must be complete.");
  }
  return failures;
}

export function renderSpecTransition(content, event) {
  const statusPattern = /^- \*\*Delivery Status\*\*: .+$/m;
  if (!statusPattern.test(content)) throw new Error("Delivery Status field is missing.");

  let updated = content.replace(statusPattern, `- **Delivery Status**: ${event.to}`);
  const versionPattern = /^- \*\*Workflow Version\*\*: .+$/m;
  if (versionPattern.test(updated)) {
    updated = updated.replace(versionPattern, `- **Workflow Version**: ${event.version}`);
  } else {
    updated = updated.replace(statusPattern, `- **Delivery Status**: ${event.to}\n- **Workflow Version**: ${event.version}`);
  }

  updated = updated.trimEnd();
  const heading = "## 10. Transition History";
  const row = `| ${event.timestamp} | ${event.from} | ${event.to} | ${event.actor.replaceAll("|", "\\|")} | ${event.reason.replaceAll("|", "\\|")} |`;
  if (updated.includes(heading)) return `${updated}\n${row}\n`;
  return `${updated}\n\n${heading}\n\n| Timestamp | From | To | Actor | Reason |\n| --- | --- | --- | --- | --- |\n${row}\n`;
}