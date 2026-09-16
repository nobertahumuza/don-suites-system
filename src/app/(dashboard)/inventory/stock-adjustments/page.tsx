import { getStockTransactions, getInventoryItems, adjustStock } from '@/lib/actions/inventory';
import { revalidatePath } from 'next/cache';
import AdjustmentsView from './adjustments-view';

async function handleAdjustStock(formData: FormData) {
  'use server';
  await adjustStock(Number(formData.get('item_id')), {
    type: formData.get('adjustment_type') as string,
    quantity: Number(formData.get('quantity')),
    notes: formData.get('notes') as string || undefined,
  });
  revalidatePath('/inventory/stock-adjustments');
  revalidatePath('/inventory');
}

export default async function StockAdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const itemId = typeof params.item === 'string' ? Number(params.item) : undefined;

  let transactions: any[];
  let items: any[];
  try {
    [transactions, items] = await Promise.all([
      getStockTransactions(itemId || undefined),
      getInventoryItems(),
    ]);
  } catch {
    transactions = [];
    items = [];
  }

  return (
    <AdjustmentsView
      transactions={transactions}
      items={items}
      selectedItemId={itemId}
      onHandleAdjustStock={handleAdjustStock}
    />
  );
}
