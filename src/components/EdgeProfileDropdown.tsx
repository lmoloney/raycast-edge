import { List } from "@raycast/api";
import { useEffect } from "react";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { EdgeProfile } from "../types/interfaces";
import { DEFAULT_PROFILE_ID, ALL_PROFILES_CACHE_KEY, DUMMY_PROFILE_NAME } from "../constants";
import { getApplicationType, getCurrentProfileCacheKey } from "../utils/appUtils";
import { loadProfilesForApplicationType } from "../utils/profileUtils";

interface Props {
  onProfileSelected?: (profile: string) => void;
}

const DEFAULT_PROFILE = { name: DUMMY_PROFILE_NAME, id: DEFAULT_PROFILE_ID };

export default function EdgeProfileDropDown({ onProfileSelected }: Props) {
  const applicationType = getApplicationType();
  const [selectedProfile, setSelectedProfile] = useCachedState<string>(getCurrentProfileCacheKey(), DEFAULT_PROFILE_ID);
  const [profiles, setProfiles] = useCachedState<EdgeProfile[]>(ALL_PROFILES_CACHE_KEY, [DEFAULT_PROFILE]);
  const { data: loadedProfiles } = useCachedPromise(loadProfilesForApplicationType, [applicationType]);

  useEffect(() => {
    if (loadedProfiles?.length) {
      setProfiles(loadedProfiles);
      if (!loadedProfiles.find((profile) => profile.id === selectedProfile)) {
        setSelectedProfile(loadedProfiles[0].id);
      }
    }
  }, [loadedProfiles, selectedProfile]);

  useEffect(() => {
    if (selectedProfile) {
      onProfileSelected?.(selectedProfile);
    }
  }, [selectedProfile]);

  if (!profiles || profiles.length < 2) {
    return null;
  }

  return (
    <List.Dropdown tooltip="Select Edge Profile" value={selectedProfile} onChange={setSelectedProfile}>
      {profiles.map((profile) => (
        <List.Dropdown.Item key={profile.id} value={profile.id} title={profile.name} />
      ))}
    </List.Dropdown>
  );
}
