'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const DEFAULT_TAX_SETTINGS = {
  service_charge_rate: 0.10,
  vat_rate: 0.18,
};

export async function calculateTaxes(subtotal: number) {
  const settings = await getTaxSettings();
  const serviceCharge = Math.round(subtotal * settings.service_charge_rate);
  const vat = Math.round((subtotal + serviceCharge) * settings.vat_rate);
  const total = subtotal + serviceCharge + vat;

  return {
    subtotal,
    service_charge: serviceCharge,
    vat_amount: vat,
    total_with_tax: total,
  };
}

export async function getTaxSettings() {
  const rows = await prisma.$queryRawUnsafe<{ setting_value: string }[]>(
    `SELECT setting_value FROM email_settings WHERE setting_key = 'tax_settings' LIMIT 1`
  );

  if (rows.length > 0) {
    try {
      const parsed = JSON.parse(rows[0].setting_value || '{}');
      return {
        service_charge_rate: parsed.service_charge_rate ?? DEFAULT_TAX_SETTINGS.service_charge_rate,
        vat_rate: parsed.vat_rate ?? DEFAULT_TAX_SETTINGS.vat_rate,
      };
    } catch {
      // fall through
    }
  }

  return { ...DEFAULT_TAX_SETTINGS };
}

export async function updateTaxSettings(data: {
  service_charge_rate?: number;
  vat_rate?: number;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const current = await getTaxSettings();
  const payload = {
    service_charge_rate: data.service_charge_rate ?? current.service_charge_rate,
    vat_rate: data.vat_rate ?? current.vat_rate,
  };

  const existing = await prisma.$queryRawUnsafe<{ setting_key: string }[]>(
    `SELECT setting_key FROM email_settings WHERE setting_key = 'tax_settings' LIMIT 1`
  );

  if (existing.length > 0) {
    await prisma.$queryRawUnsafe(
      `UPDATE email_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = 'tax_settings'`,
      JSON.stringify(payload)
    );
  } else {
    await prisma.$queryRawUnsafe(
      `INSERT INTO email_settings (setting_key, setting_value, created_at, updated_at) VALUES ('tax_settings', $1, NOW(), NOW())`,
      JSON.stringify(payload)
    );
  }

  revalidatePath('/settings/taxes');
  return { success: true };
}
