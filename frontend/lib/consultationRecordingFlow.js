export async function startConsultationRecordingFlow(params) {
  const {
    startBrowserCapture,
    markRecordingStarted,
    rollbackBrowserCapture,
  } = params;

  await startBrowserCapture();

  try {
    return await markRecordingStarted();
  } catch (error) {
    await rollbackBrowserCapture();
    throw error;
  }
}
