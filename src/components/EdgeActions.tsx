import { ReactElement } from "react";
import { Action, ActionPanel, closeMainWindow, getPreferenceValues, Icon } from "@raycast/api";
import { openNewTab, openTabInSpecificProfile, setActiveTab } from "../actions";
import { PinnedEdgeProfileMap, Preferences, SettingsProfileOpenBehaviour, Tab } from "../types/interfaces";
import { useCachedState } from "@raycast/utils";
import { DEFAULT_PROFILE_ID, PINNED_PROFILE_SLOTS_KEY } from "../constants";
import { getCurrentProfileCacheKey } from "../utils/appUtils";

export class EdgeActions {
  public static NewTab = NewTabActions;
  public static TabList = TabListItemActions;
  public static TabHistory = HistoryItemActions;
}

function NewTabActions({ query }: { query?: string }): ReactElement {
  const { openTabInProfile } = getPreferenceValues<Preferences>();
  const [profileCurrent] = useCachedState(getCurrentProfileCacheKey(), DEFAULT_PROFILE_ID);

  return (
    <ActionPanel title="New Tab">
      <Action
        onAction={() => openNewTab({ query, profileCurrent, openTabInProfile })}
        title={query ? `Search "${query}"` : "Open Empty Tab"}
      />
    </ActionPanel>
  );
}

function TabListItemActions({ tab }: { tab: Tab }) {
  return (
    <ActionPanel title={tab.title}>
      <GoToTab tab={tab} />
      <Action.CopyToClipboard title="Copy URL" content={tab.url} />
    </ActionPanel>
  );
}

function HistoryItemActions({
  title,
  url,
  profile: profileOriginal,
}: {
  title: string;
  url: string;
  profile: string;
}): ReactElement {
  const { openTabInProfile } = getPreferenceValues<Preferences>();
  const [profileCurrent] = useCachedState(getCurrentProfileCacheKey(), DEFAULT_PROFILE_ID);
  const [pinnedProfiles] = useCachedState<PinnedEdgeProfileMap>(PINNED_PROFILE_SLOTS_KEY, {});
  const pinnedSlots = Object.values(pinnedProfiles ?? {}).sort((left, right) => left.slot - right.slot);

  return (
    <ActionPanel title={title}>
      <Action onAction={() => openNewTab({ url, profileOriginal, profileCurrent, openTabInProfile })} title={"Open"} />
      <ActionPanel.Section title={"Open in profile"}>
        <Action
          onAction={() =>
            openNewTab({
              url,
              profileOriginal,
              profileCurrent,
              openTabInProfile: SettingsProfileOpenBehaviour.ProfileCurrent,
            })
          }
          title={"Open in Current Profile"}
        />
        <Action
          onAction={() =>
            openNewTab({
              url,
              profileOriginal,
              profileCurrent,
              openTabInProfile: SettingsProfileOpenBehaviour.ProfileOriginal,
            })
          }
          title={"Open in Original Profile"}
        />
      </ActionPanel.Section>
      {pinnedSlots.length > 0 && (
        <ActionPanel.Section title={"Open in pinned profile"}>
          {pinnedSlots.map((pinnedProfile) => (
            <Action
              key={`pinned-slot-${pinnedProfile.slot}`}
              title={`Open in Slot ${pinnedProfile.slot} (${pinnedProfile.profileName})`}
              onAction={() =>
                openTabInSpecificProfile({
                  url,
                  profileId: pinnedProfile.profileId,
                  applicationType: pinnedProfile.applicationType,
                  reuseExistingWindow: true,
                })
              }
            />
          ))}
        </ActionPanel.Section>
      )}
      <Action.CopyToClipboard title="Copy URL" content={url} shortcut={{ modifiers: ["cmd"], key: "c" }} />
    </ActionPanel>
  );
}

function GoToTab(props: { tab: Tab }) {
  async function handleAction() {
    await setActiveTab(props.tab);
    await closeMainWindow();
  }

  return <Action title="Open Tab" icon={{ source: Icon.Eye }} onAction={handleAction} />;
}
