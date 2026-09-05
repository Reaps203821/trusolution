// Resolves what name someone should appear as elsewhere in the app,
// respecting their chosen Profile Mode (Ghost/Masked/Open).
export function resolveDisplayName(profile, anonymousLabel = "Anonymous") {
  switch (profile.profileMode) {
    case "ghost":
      return anonymousLabel;
    case "masked":
      return profile.nickname?.trim() || anonymousLabel;
    case "open":
    default:
      return profile.fullName?.trim() || profile.username?.trim() || "Member";
  }
}
