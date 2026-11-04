import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import Authenticator from "./authenticator";
import { loadSyncedEvents, syncReminders } from "./event-sync";
import { getUser } from "./trpc";

// iOS wakes the app now and then (it decides when, typically overnight or around regular use, and
// never after the user force-quits it) to backfill reminders for events signed up to on the
// website. Live Activities can only be requested while the app is open, so banners wait for that.

const TASK_NAME = "online-event-sync";

// Must be defined at module scope, before the app registers or runs the task.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // getUser reads the stored session without the side effects of a full sign-in check.
    const user = Authenticator.user ?? await getUser();
    // No user can also mean the keychain is locked; syncing then would cancel every reminder.
    if (!user) return BackgroundTask.BackgroundTaskResult.Success;
    await syncReminders(user, await loadSyncedEvents(user.id));
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn("Background event sync:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundEventSync() {
  try {
    if (await BackgroundTask.getStatusAsync() !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) return;
    await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 6 * 60 });
  } catch (error) {
    console.warn("Background event sync:", error);
  }
}
