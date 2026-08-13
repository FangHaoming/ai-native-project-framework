export function decideTransition({ currentState, currentVersion, legalTransitions, command }) {
  const failures = [];
  const legalTargets = legalTransitions[currentState] || [];

  if (!Number.isInteger(currentVersion) || currentVersion < 0) {
    failures.push(`Current workflow version must be a non-negative integer, received '${currentVersion}'.`);
  }
  if (command.from !== currentState) {
    failures.push(`Command source '${command.from}' does not match current state '${currentState}'.`);
  }
  if (!legalTargets.includes(command.to)) {
    failures.push(`Illegal transition: ${currentState} -> ${command.to}`);
  }
  if (command.expectedVersion !== undefined && command.expectedVersion !== currentVersion) {
    failures.push(`Workflow version conflict: expected ${command.expectedVersion}, current ${currentVersion}.`);
  }

  return failures.length
    ? Object.freeze({ accepted: false, failures: Object.freeze(failures) })
    : Object.freeze({ accepted: true, nextState: command.to, nextVersion: currentVersion + 1 });
}