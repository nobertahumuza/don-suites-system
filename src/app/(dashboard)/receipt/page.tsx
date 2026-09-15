import { getFbOrderById, getFbOrderItems, markPaid } from '@/lib/actions/fb';
import { revalidatePath } from 'next/cache';
import ReceiptView from './receipt-view';

async function handleMarkPaid(formData: FormData) {
  'use server';
  const orderId = Number(formData.get('orderId'));
  const type = formData.get('type') as string;
  await markPaid(orderId);
  revalidatePath(`/receipt?type=${type}&id=${orderId}`);
}

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const type = typeof params.type === 'string' ? params.type : 'fb';
  const id = typeof params.id === 'string' ? Number(params.id) : 0;

  if (id <= 0) {
    return <div className="p-10 text-center text-gray-500">Invalid order ID</div>;
  }

  let orderLabel = '';
  let date = '';
  let guestName = '';
  let roomNumber = '';
  let orderType = '';
  let servedBy = '';
  let paymentStatus = '';
  let subtotal = 0;
  let surcharge = 0;
  let total = 0;
  let status = '';
  let items: any[] = [];

  if (type === 'fb') {
    const order = await getFbOrderById(id);
    if (!order) {
      return <div className="p-10 text-center text-gray-500">Order not found</div>;
    }
    const orderItems = await getFbOrderItems(id);

    orderLabel = `Order #${id}`;
    const createdAt = order.created_at ? new Date(order.created_at as string | number | Date) : new Date();
    date = createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    guestName = order.guest_name || 'Walk-in';
    roomNumber = order.room_number || '';
    orderType = (order.order_type || '').replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    servedBy = order.served_by_name || 'N/A';
    paymentStatus = order.payment_status || '';
    subtotal = Number(order.subtotal);
    surcharge = Number(order.room_service_surcharge);
    total = Number(order.total);
    status = order.status || '';
    items = orderItems;
  } else {
    return <div className="p-10 text-center text-gray-500">Invalid receipt type</div>;
  }

  return (
    <ReceiptView
      data={{
        orderLabel,
        date,
        guestName,
        roomNumber,
        orderType,
        servedBy,
        paymentStatus,
        subtotal,
        surcharge,
        total,
        status,
        items,
        orderId: id,
        type,
      }}
      onHandleMarkPaid={handleMarkPaid}
    />
  );
}
