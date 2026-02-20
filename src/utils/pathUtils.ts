import path from "path";
import { DEFAULT_PROFILE_ID } from "../constants";
import { ApplicationType } from "../types/enums";
import { getApplicationName } from "./appUtils";

const PATH_PREFIX = "Application Support";

export const getDefaultEdgeProfilePath = (applicationType?: ApplicationType) => [
  PATH_PREFIX,
  getApplicationName(applicationType),
];

export const getDefaultEdgeStatePath = (applicationType?: ApplicationType) => [
  PATH_PREFIX,
  getApplicationName(applicationType),
  "Local State",
];

const userLibraryDirectoryPath = () => {
  if (!process.env.HOME) {
    throw new Error("$HOME environment variable is not set.");
  }

  return path.join(process.env.HOME, "Library");
};

export const getHistoryDbPath = (profile?: string, applicationType?: ApplicationType) =>
  path.join(
    userLibraryDirectoryPath(),
    ...getDefaultEdgeProfilePath(applicationType),
    profile ?? DEFAULT_PROFILE_ID,
    "History",
  );

/**
 * @returns Path to the Local State file which contains all the profile information
 */
export const getLocalStatePath = (applicationType?: ApplicationType) =>
  path.join(userLibraryDirectoryPath(), ...getDefaultEdgeStatePath(applicationType));

export const getBookmarksFilePath = (profile?: string, applicationType?: ApplicationType) =>
  path.join(
    userLibraryDirectoryPath(),
    ...getDefaultEdgeProfilePath(applicationType),
    profile ?? DEFAULT_PROFILE_ID,
    "Bookmarks",
  );

export const getCollectionsDbPath = (profile?: string, applicationType?: ApplicationType) =>
  path.join(
    userLibraryDirectoryPath(),
    ...getDefaultEdgeProfilePath(applicationType),
    profile ?? DEFAULT_PROFILE_ID,
    "Collections",
    "collectionsSQLite",
  );
