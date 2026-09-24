export async function persistAlert(scope: string, message: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.systemAlert.create({
      data: {
        type: 'API_ERROR',
        severity: 'MEDIUM',
        message: `${scope}: ${message.slice(0, 480)}`,
        metadata: { scope },
      },
    });
  } catch (alertError) {
    console.error(
      '[caught:systemAlert]',
      alertError instanceof Error ? alertError.message : String(alertError),
    );
  }
}
