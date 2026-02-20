import { Cache, showToast, Toast } from "@raycast/api";
import { openTabInSpecificProfile } from "./actions";
import { DEFAULT_ERROR_TITLE, PINNED_PROFILE_SLOTS_KEY } from "./constants";
import { PinnedEdgeProfileMap } from "./types/interfaces";
import { geNotInstalledMessage } from "./utils/messageUtils";

const slotKey = (slot: number) => `${slot}`;

function parsePinnedProfiles(value: string | undefined): PinnedEdgeProfileMap {
  if (!value) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(value);
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }
    return parsedValue as PinnedEdgeProfileMap;
  } catch {
    return {};
  }
}

export async function openPinnedProfileSlot(slot: number): Promise<void> {
  const cache = new Cache();
  const toast = await showToast({ style: Toast.Style.Animated, title: `Opening slot ${slot}` });
  const rawPinnedProfiles = cache.get(PINNED_PROFILE_SLOTS_KEY);
  const pinnedProfiles = parsePinnedProfiles(rawPinnedProfiles ?? undefined);
  const pinnedProfile = pinnedProfiles[slotKey(slot)];

  if (!pinnedProfile) {
    toast.style = Toast.Style.Failure;
    toast.title = `Slot ${slot} is not pinned`;
    toast.message = "Use Manage Pinned Profiles to assign a profile.";
    return;
  }

  try {
    await openTabInSpecificProfile({
      profileId: pinnedProfile.profileId,
      applicationType: pinnedProfile.applicationType,
      reuseExistingWindow: true,
    });
    toast.style = Toast.Style.Success;
    toast.title = `Opened ${pinnedProfile.profileName}`;
    toast.message = `Slot ${slot} • ${pinnedProfile.applicationName}`;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = DEFAULT_ERROR_TITLE;
    if (error instanceof Error && error.message === geNotInstalledMessage(pinnedProfile.applicationType)) {
      toast.message = `${pinnedProfile.applicationName} is not installed`;
    } else {
      toast.message = `${error}`;
    }
  }
}
