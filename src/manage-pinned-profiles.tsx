import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { openTabInSpecificProfile } from "./actions";
import { PINNED_PROFILE_SLOT_COUNT, PINNED_PROFILE_SLOTS_KEY } from "./constants";
import { EdgeProfile, PinnedEdgeProfile, PinnedEdgeProfileMap } from "./types/interfaces";
import { loadProfilesAcrossApplicationTypes } from "./utils/profileUtils";

const slotKey = (slot: number) => `${slot}`;

function getPinnedProfileForSlot(pinnedProfiles: PinnedEdgeProfileMap, slot: number): PinnedEdgeProfile | undefined {
  return pinnedProfiles[slotKey(slot)];
}

function getAssignedSlotsForProfile(pinnedProfiles: PinnedEdgeProfileMap, profile: EdgeProfile): number[] {
  return Object.values(pinnedProfiles)
    .filter(
      (pinnedProfile) =>
        pinnedProfile.profileId === profile.id && pinnedProfile.applicationType === profile.applicationType,
    )
    .map((pinnedProfile) => pinnedProfile.slot)
    .sort((left, right) => left - right);
}

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");
  const [pinnedProfiles, setPinnedProfiles] = useCachedState<PinnedEdgeProfileMap>(PINNED_PROFILE_SLOTS_KEY, {});
  const { data: discoveredProfiles, isLoading } = useCachedPromise(loadProfilesAcrossApplicationTypes);
  const profiles = discoveredProfiles ?? [];

  const assignProfileToSlot = async (slot: number, profile: EdgeProfile) => {
    if (!profile.applicationType || !profile.applicationName) {
      await showToast({ style: Toast.Style.Failure, title: "Profile metadata is incomplete" });
      return;
    }

    const pinnedProfile: PinnedEdgeProfile = {
      slot,
      profileId: profile.id,
      profileName: profile.name,
      applicationType: profile.applicationType,
      applicationName: profile.applicationName,
    };

    setPinnedProfiles((current) => ({ ...(current ?? {}), [slotKey(slot)]: pinnedProfile }));
    await showToast({
      style: Toast.Style.Success,
      title: `Pinned ${profile.name} to slot ${slot}`,
      message: profile.applicationName,
    });
  };

  const clearSlot = async (slot: number) => {
    setPinnedProfiles((current) => {
      const next = { ...(current ?? {}) };
      delete next[slotKey(slot)];
      return next;
    });
    await showToast({ style: Toast.Style.Success, title: `Cleared slot ${slot}` });
  };

  const openSlot = async (slot: number) => {
    const pinnedProfile = getPinnedProfileForSlot(pinnedProfiles, slot);
    if (!pinnedProfile) {
      await showToast({ style: Toast.Style.Failure, title: `Slot ${slot} is not pinned` });
      return;
    }

    await openTabInSpecificProfile({
      profileId: pinnedProfile.profileId,
      applicationType: pinnedProfile.applicationType,
      reuseExistingWindow: true,
    });
  };

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredProfiles = profiles.filter((profile) => {
    if (!normalizedSearch) {
      return true;
    }
    return [profile.name, profile.id, profile.applicationName]
      .filter((item): item is string => !!item)
      .some((item) => item.toLowerCase().includes(normalizedSearch));
  });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Edge profiles across Stable, Dev, Beta, and Canary"
      throttle
    >
      <List.Section title="Pinned Slots">
        {Array.from({ length: PINNED_PROFILE_SLOT_COUNT }, (_, index) => {
          const slot = index + 1;
          const pinnedProfile = getPinnedProfileForSlot(pinnedProfiles, slot);

          return (
            <List.Item
              key={`slot-${slot}`}
              icon={pinnedProfile ? Icon.Star : Icon.Circle}
              title={`Slot ${slot}${pinnedProfile ? ` — ${pinnedProfile.profileName}` : ""}`}
              subtitle={pinnedProfile?.applicationName ?? "Not pinned"}
              accessories={pinnedProfile ? [{ text: pinnedProfile.profileId }] : []}
              actions={
                pinnedProfile ? (
                  <ActionPanel>
                    <Action title="Open Pinned Profile" onAction={() => openSlot(slot)} icon={Icon.AppWindow} />
                    <Action title="Clear Slot" onAction={() => clearSlot(slot)} icon={Icon.Trash} />
                  </ActionPanel>
                ) : undefined
              }
            />
          );
        })}
      </List.Section>
      <List.Section title="Available Profiles">
        {filteredProfiles.map((profile) => {
          const assignedSlots = getAssignedSlotsForProfile(pinnedProfiles, profile);

          return (
            <List.Item
              key={`${profile.applicationType ?? "unknown"}-${profile.id}`}
              title={profile.name}
              subtitle={profile.applicationName ?? "Microsoft Edge"}
              accessories={[
                { text: profile.id },
                ...(assignedSlots.length > 0 ? [{ text: `Pinned: ${assignedSlots.join(", ")}` }] : []),
              ]}
              actions={
                <ActionPanel>
                  {Array.from({ length: PINNED_PROFILE_SLOT_COUNT }, (_, index) => {
                    const slot = index + 1;
                    return (
                      <Action
                        key={`pin-${profile.id}-${slot}`}
                        title={`Pin to Slot ${slot}`}
                        onAction={() => assignProfileToSlot(slot, profile)}
                        icon={Icon.Pin}
                      />
                    );
                  })}
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
