import { QuestScreen } from "./glove80/QuestScreen.tsx";
import { PracticeScreen } from "./practice/PracticeScreen.tsx";
import { SettingsScreen } from "./settings/SettingsScreen.tsx";

export const views = {
  practice: PracticeScreen,
  settings: SettingsScreen,
  quest: QuestScreen,
} as const;
