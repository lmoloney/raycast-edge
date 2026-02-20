import { existsSync, promises } from "fs";
import { DEFAULT_PROFILE_ID, DUMMY_PROFILE_NAME } from "../constants";
import { ApplicationType } from "../types/enums";
import { EdgeProfile } from "../types/interfaces";
import { getApplicationName } from "./appUtils";
import { getLocalStatePath } from "./pathUtils";

const APPLICATION_TYPES = [
  ApplicationType.EdgeStable,
  ApplicationType.EdgeDev,
  ApplicationType.EdgeBeta,
  ApplicationType.EdgeCanary,
];

function withBuildContext(applicationType: ApplicationType, profiles: EdgeProfile[]): EdgeProfile[] {
  const applicationName = getApplicationName(applicationType);

  return profiles.map((profile) => ({
    ...profile,
    applicationType,
    applicationName,
  }));
}

function getProfileInfoCache(edgeState: unknown): Record<string, { user_name?: string; name?: string }> {
  const profileInfoCache = (edgeState as { profile?: { info_cache?: unknown } })?.profile?.info_cache;
  if (!profileInfoCache || typeof profileInfoCache !== "object") {
    return {};
  }
  return profileInfoCache as Record<string, { user_name?: string; name?: string }>;
}

export async function loadProfilesForApplicationType(
  applicationType: ApplicationType,
  includeFallback = true,
): Promise<EdgeProfile[]> {
  const localStatePath = getLocalStatePath(applicationType);

  if (!existsSync(localStatePath)) {
    return includeFallback
      ? withBuildContext(applicationType, [{ id: DEFAULT_PROFILE_ID, name: DUMMY_PROFILE_NAME }])
      : [];
  }

  try {
    const edgeState = await promises.readFile(localStatePath, "utf-8");
    const profiles = getProfileInfoCache(JSON.parse(edgeState));
    const discoveredProfiles = Object.entries(profiles)
      .map(([id, profile]) => ({
        id,
        name: profile.user_name || profile.name || id,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    if (discoveredProfiles.length === 0 && includeFallback) {
      return withBuildContext(applicationType, [{ id: DEFAULT_PROFILE_ID, name: DUMMY_PROFILE_NAME }]);
    }

    return withBuildContext(applicationType, discoveredProfiles);
  } catch {
    return includeFallback
      ? withBuildContext(applicationType, [{ id: DEFAULT_PROFILE_ID, name: DUMMY_PROFILE_NAME }])
      : [];
  }
}

export async function loadProfilesAcrossApplicationTypes(): Promise<EdgeProfile[]> {
  const allProfiles = await Promise.all(
    APPLICATION_TYPES.map((applicationType) => loadProfilesForApplicationType(applicationType, false)),
  );
  return allProfiles.flat();
}
