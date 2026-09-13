'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getEmailSettings() {
  const result = await pool.query('SELECT setting_key, setting_value FROM email_settings');
  const settings: Record<string, string> = {};
  result.rows.forEach((row: any) => {
    settings[row.setting_key] = row.setting_value;
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
    await pool.query(
      'INSERT INTO email_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
      [field, val]
    );
  }

  revalidatePath('/settings/smtp');
  return { success: true };
}

export async function getBackupList() {
  const result = await pool.query(
    `SELECT setting_key, setting_value FROM email_settings WHERE setting_key = 'backup_dir'`
  );
  return result.rows[0]?.setting_value || 'backups';
}
