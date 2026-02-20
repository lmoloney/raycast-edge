import { PopToRootType, closeMainWindow, popToRoot } from "@raycast/api";
import { SettingsProfileOpenBehaviour, Tab } from "../types/interfaces";
import { getApplicationName, getApplicationType } from "../utils/appUtils";
import { geNotInstalledMessage } from "../utils/messageUtils";
import { DEFAULT_PROFILE_ID } from "../constants";
import { runAppleScript } from "@raycast/utils";
import { ApplicationType } from "../types/enums";

export async function getOpenTabs(): Promise<Tab[]> {
  await validateAppIsInstalled();

  const openTabs = await runAppleScript(`
      set _output to ""
      tell application "${getApplicationName()}"
        set _window_index to 1
        repeat with w in windows
          set _tab_index to 1
          repeat with t in tabs of w
            set _title to get title of t
            set _url to get URL of t
            set _favicon to ""
            set _output to (_output & _title & "${Tab.TAB_CONTENTS_SEPARATOR}" & _url & "${
              Tab.TAB_CONTENTS_SEPARATOR
            }" & _favicon & "${Tab.TAB_CONTENTS_SEPARATOR}" & _window_index & "${
              Tab.TAB_CONTENTS_SEPARATOR
            }" & _tab_index & "\\n")
            set _tab_index to _tab_index + 1
          end repeat
          set _window_index to _window_index + 1
          if _window_index > count windows then exit repeat
        end repeat
      end tell
      return _output
  `);

  return openTabs
    .split("\n")
    .filter((line) => line.length !== 0)
    .map((line) => Tab.parse(line));
}

export async function openNewTab({
  url,
  query,
  profileCurrent,
  profileOriginal = DEFAULT_PROFILE_ID,
  openTabInProfile,
}: {
  url?: string;
  query?: string;
  profileCurrent: string;
  profileOriginal?: string;
  openTabInProfile: SettingsProfileOpenBehaviour;
}): Promise<boolean | string> {
  setTimeout(() => {
    popToRoot({ clearSearchBar: true });
  }, 3000);
  await Promise.all([
    closeMainWindow({ clearRootSearch: true, popToRootType: PopToRootType.Suspended }),
    validateAppIsInstalled(),
  ]);

  let script = "";

  const getOpenInProfileCommand = (profile: string, useNewInstance = true) => `
    set profile to quoted form of "${profile}"
    set link to quoted form of "${url ? url : query ? "https://google.com/search?q=" + query : "about:blank"}"
    do shell script "open ${useNewInstance ? "-na" : "-a"} '${getApplicationName()}' --args --profile-directory=" & profile & " " & link
  `;

  switch (openTabInProfile) {
    case SettingsProfileOpenBehaviour.Default:
      script = getOpenInProfileCommand(DEFAULT_PROFILE_ID);
      break;
    case SettingsProfileOpenBehaviour.ProfileCurrent:
      script = getOpenInProfileCommand(profileCurrent);
      break;
    case SettingsProfileOpenBehaviour.ProfileOriginal:
      script = getOpenInProfileCommand(profileOriginal);
      break;
  }

  return await runAppleScript(script);
}

export async function openTabInSpecificProfile({
  profileId,
  applicationType,
  url,
  query,
  reuseExistingWindow = true,
}: {
  profileId: string;
  applicationType: ApplicationType;
  url?: string;
  query?: string;
  reuseExistingWindow?: boolean;
}): Promise<boolean | string> {
  await validateAppIsInstalled(applicationType);

  const getOpenInProfileCommand = (useNewInstance: boolean) => `
    set profile to quoted form of "${profileId}"
    set link to quoted form of "${url ? url : query ? "https://google.com/search?q=" + query : "about:blank"}"
    do shell script "open ${useNewInstance ? "-na" : "-a"} '${getApplicationName(applicationType)}' --args --profile-directory=" & profile & " " & link
  `;

  if (!reuseExistingWindow) {
    return await runAppleScript(getOpenInProfileCommand(true));
  }

  try {
    return await runAppleScript(getOpenInProfileCommand(false));
  } catch {
    return await runAppleScript(getOpenInProfileCommand(true));
  }
}

export async function setActiveTab(tab: Tab): Promise<void> {
  await runAppleScript(`
    tell application "${getApplicationName()}"
      activate

      -- this iteration finds the window that has the target tab and brings that to front
      set _targetURL to "${tab.url}"
      repeat with w in windows
        set _tab_index to 1
        repeat with t in tabs of w
          if URL of t is equal to _targetURL then
            set index of w to 1
            exit repeat
          end if
          set _tab_index to _tab_index + 1
        end repeat
        if URL of active tab of w is equal to _targetURL then
          exit repeat
        end if
      end repeat

      -- this iteration activates the target Tab in the active window
      repeat with w in windows
        set _tab_index to 1
        repeat with t in tabs of w
          if URL of t is equal to _targetURL then
            set active tab index of w to _tab_index
            exit repeat
          end if
          set _tab_index to _tab_index + 1
        end repeat
        if URL of active tab of w is equal to _targetURL then
          exit repeat
        end if
      end repeat
    end tell
  `);
}

export const validateAppIsInstalled = async (applicationType: ApplicationType = getApplicationType()) => {
  const appInstalled = await runAppleScript(`
    set isInstalled to false
    try
        do shell script "osascript -e 'exists application \\"${getApplicationName(applicationType)}\\"'"
        set isInstalled to true
    end try

    return isInstalled`);

  if (appInstalled === "false") {
    throw new Error(geNotInstalledMessage(applicationType));
  }
};

export async function getActiveTabUrl(): Promise<string> {
  await validateAppIsInstalled();

  const activeTabUrl = await runAppleScript(
    `tell application "${getApplicationName()}" to return URL of active tab of front window`,
  );

  return activeTabUrl;
}
