import { openPinnedProfileSlot } from "./open-pinned-profile";

export default async function Command() {
  await openPinnedProfileSlot(4);
}
