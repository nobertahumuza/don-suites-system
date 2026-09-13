import { getFbOrders, getFbStats, markPaid, updateStatus } from '@/lib/actions/fb';
import { revalidatePath } from 'next/cache';
import FbOrdersView from './fb-orders-view';

async function handleMarkPaid(formData: FormData) {
  'use server';
  const orderId = Number(formData.get('orderId'));
  await markPaid(orderId);
  revalidatePath('/fb/orders');
}

async function handleUpdateStatus(formData: FormData) {
  'use server';
  const orderId = Number(formData.get('orderId'));
  const status = formData.get('status') as string;
  await updateStatus(orderId, status);
  revalidatePath('/fb/orders');
}

export default async function FbOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const date = typeof params.date === 'string' ? params.date : undefined;
  const paymentStatus = typeof params.status === 'string' ? params.status : undefined;
  const fulfillmentStatus = typeof params.fulfillment === 'string' ? params.fulfillment : undefined;
  const orderType = typeof params.type === 'string' ? params.type : undefined;

  const [orders, stats] = await Promise.all([
    getFbOrders({ date, paymentStatus, fulfillmentStatus, orderType }),
    getFbStats(),
  ]);

  return (
    <FbOrdersView
      orders={orders}
      stats={stats}
      date={date}
      paymentStatus={paymentStatus}
      fulfillmentStatus={fulfillmentStatus}
      orderType={orderType}
      onHandleMarkPaid={handleMarkPaid}
      onHandleUpdateStatus={handleUpdateStatus}
    />
  );
}
