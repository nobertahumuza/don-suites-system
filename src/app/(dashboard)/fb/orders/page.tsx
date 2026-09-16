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

  try {
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load F&B orders';
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <i className="fas fa-exclamation-triangle text-4xl mb-3 block" style={{ color: '#ef4444', opacity: 0.3 }}></i>
        <h5 className="text-gray-400 font-medium mb-3">Failed to load data</h5>
        <p className="text-xs text-gray-400 mb-4">{errorMessage}</p>
        <a href="/fb/orders" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0f1a3c' }}>
          <i className="fas fa-redo"></i> Try Again
        </a>
      </div>
    );
  }
}
