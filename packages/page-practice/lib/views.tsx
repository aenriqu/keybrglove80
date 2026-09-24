import { DrillsScreen } from "./glove80/DrillsScreen.tsx";
import { PathScreen } from "./glove80/PathScreen.tsx";
import { QuestScreen } from "./glove80/QuestScreen.tsx";
import { PracticeScreen } from "./practice/PracticeScreen.tsx";
import { SettingsScreen } from "./settings/SettingsScreen.tsx";

export const views = {
  practice: PracticeScreen,
  settings: SettingsScreen,
  quest: QuestScreen,
  drills: DrillsScreen,
  path: PathScreen,
} as const;
