import { LocalNotifications } from '@capacitor/local-notifications';

function notificationId(localId) {
  return [...localId].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0) & 0x7fffffff;
}

export async function scheduleFollowUpNotification(followUp) {
  if (!followUp?.follow_up_date) return false;

  try {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.warn('Follow-up reminder permission was not granted');
      return false;
    }

    const scheduledAt = new Date(`${followUp.follow_up_date}T09:00:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) return false;

    // Demo behavior targets the doctor's device; production should target the patient's or assigned ASHA's device by region/beneficiary assignment.
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId(followUp.local_id),
        title: 'Upcoming follow-up',
        body: followUp.follow_up_type || 'Patient follow-up is due today.',
        schedule: { at: scheduledAt },
        extra: { local_id: followUp.local_id },
      }],
    });
    return true;
  } catch (error) {
    console.warn('Could not schedule local follow-up notification:', error);
    return false;
  }
}

export default { scheduleFollowUpNotification };
