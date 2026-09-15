'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getEmailSettings() {
  const rows = await prisma.email_settings.findMany({
    select: { setting_key: true, setting_value: true },
  });
  const settings: Record<string, string> = {};
  rows.forEach((row) => {
    settings[row.setting_key] = row.setting_value ?? '';
  });
  return settings;
}

export async function saveEmailSettings(data: {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  from_name: string;
  from_email: string;
  recipient_email: string;
  director_email: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const fields = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption', 'from_name', 'from_email', 'recipient_email', 'director_email'] as const;

  for (const field of fields) {
    const val = data[field] || '';
    await prisma.email_settings.upsert({
      where: { setting_key: field },
      update: { setting_value: val },
      create: { setting_key: field, setting_value: val },
    });
  }

  revalidatePath('/settings/smtp');
  return { success: true };
}

export async function getBackupList() {
  const row = await prisma.email_settings.findUnique({
    where: { setting_key: 'backup_dir' },
    select: { setting_value: true },
  });
  return row?.setting_value || 'backups';
}
