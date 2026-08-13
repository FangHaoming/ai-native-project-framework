import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

export function resolveWorkflowSnapshot(root, states, reference) {
  if (!reference) throw new Error("Spec reference is required.");
  if (path.basename(reference) !== reference) throw new Error("Spec reference must be an exact filename, not a path.");
  const filename = reference.endsWith(".md") ? reference : `${reference}.md`;
  const matches = states.flatMap((state) => {
    const filePath = path.join(root, "specs", state, filename);
    return existsSync(filePath) ? [{ state, filename, filePath }] : [];
  });
  if (matches.length === 0) throw new Error(`Spec not found: ${filename}`);
  if (matches.length > 1) throw new Error(`Spec reference is ambiguous: ${filename}`);
  return Object.freeze({ ...matches[0], content: readFileSync(matches[0].filePath, "utf8") });
}

export function persistWorkflowSnapshot(root, snapshot, targetState, nextContent) {
  const targetPath = path.join(root, "specs", targetState, snapshot.filename);
  if (existsSync(targetPath)) throw new Error(`Target Spec already exists: ${path.relative(root, targetPath)}`);

  const nonce = `${process.pid}-${Date.now()}`;
  const preparedPath = `${targetPath}.prepared-${nonce}`;
  const rollbackPath = `${snapshot.filePath}.rollback-${nonce}`;
  writeFileSync(preparedPath, nextContent, { flag: "wx" });

  try {
    renameSync(snapshot.filePath, rollbackPath);
    renameSync(preparedPath, targetPath);
  } catch (error) {
    if (existsSync(rollbackPath) && !existsSync(snapshot.filePath)) renameSync(rollbackPath, snapshot.filePath);
    if (existsSync(preparedPath)) unlinkSync(preparedPath);
    throw error;
  }

  try {
    unlinkSync(rollbackPath);
  } catch {
    // The visible transition is complete; the named rollback artifact remains available for manual inspection.
  }

  return targetPath;
}