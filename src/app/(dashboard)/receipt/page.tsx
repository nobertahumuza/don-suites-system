import { getFbOrderById, getFbOrderItems, markPaid } from '@/lib/actions/fb';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    guestName = order.guest_name || 'Walk-in';
    roomNumber = order.room_number || '';
    orderType = order.order_type?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || '';
    servedBy = order.served_by_name || 'N/A';
    paymentStatus = order.payment_status;
    subtotal = Number(order.subtotal);
    surcharge = Number(order.room_service_surcharge);
    total = Number(order.total);
    status = order.status;
    items = orderItems;
  } else {
    return <div className="p-10 text-center text-gray-500">Invalid receipt type</div>;
  }

  return (
    <div className="min-h-screen flex justify-center p-5" style={{ background: '#f1f5f9' }}>
      <div className="w-[340px] bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
        <div className="p-5 pb-4" style={{ padding: '20px 16px' }}>
          <div className="text-center pb-3 mb-3" style={{ borderBottom: '2px dashed #e2e8f0' }}>
            <div
              className="w-[60px] h-[60px] rounded-full mx-auto mb-2 border-2"
              style={{ borderColor: '#c9a96e', objectFit: 'cover', background: '#f1f5f9' }}
            ></div>
            <div className="text-base font-extrabold uppercase tracking-wider" style={{ color: '#0f1a3c' }}>
              Don Suites &<br />Vacation Apartments
            </div>
            <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#64748b' }}>
              Ntungamo, Kyamate Hill
            </div>
            <div className="text-[10px] mt-1.5 leading-relaxed" style={{ color: '#475569' }}>
              Tel: +256 741 445 555<br />
              Email: donsuites26@gmail.com
            </div>
          </div>

          <div className="text-center text-[13px] font-bold uppercase tracking-wider my-2.5" style={{ color: '#059669' }}>
            {orderLabel}
          </div>

          <div className="flex justify-between text-[10.5px] leading-relaxed mb-2.5" style={{ color: '#475569' }}>
            <div>
              <div><span style={{ color: '#94a3b8' }}>Date:</span> {date}</div>
              <div><span style={{ color: '#94a3b8' }}>Guest:</span> {guestName}</div>
              {roomNumber && <div><span style={{ color: '#94a3b8' }}>Room:</span> {roomNumber}</div>}
              <div><span style={{ color: '#94a3b8' }}>Type:</span> {orderType}</div>
              <div className="mt-1">
                <span style={{ color: '#94a3b8' }}>Status:</span>{' '}
                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-xl uppercase tracking-wide ${
                  status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                  status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                  status === 'served' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div><span style={{ color: '#94a3b8' }}>Served by:</span></div>
              <div className="font-semibold">{servedBy}</div>
              <div className="mt-1">
                {paymentStatus === 'paid' ? (
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">PAID</span>
                ) : (
                  <span className="inline-block bg-red-100 text-red-700 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">UNPAID</span>
                )}
              </div>
            </div>
          </div>

          <hr className="my-2" style={{ border: 'none', borderTop: '1px dashed #e2e8f0' }} />

          <div className="my-2">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between text-[11px] mb-1.5 leading-relaxed" style={{ color: '#334155' }}>
                <span className="flex-1 font-medium">{item.item_name}</span>
                <span className="mx-1.5" style={{ color: '#64748b', fontSize: '10px' }}>x{item.quantity}</span>
                <span className="font-semibold whitespace-nowrap min-w-[70px] text-right">UGX {Number(item.total_price).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <hr className="my-2" style={{ border: 'none', borderTop: '1px dashed #e2e8f0' }} />

          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] mb-1" style={{ color: '#475569' }}>
              <span>Subtotal</span>
              <span>UGX {subtotal.toLocaleString()}</span>
            </div>
            {surcharge > 0 && (
              <div className="flex justify-between text-[11px] mb-1" style={{ color: '#475569' }}>
                <span>Room Service Fee</span>
                <span>UGX {surcharge.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[14px] font-extrabold pt-2 mt-2" style={{ color: '#0f1a3c', borderTop: '2px solid #0f1a3c' }}>
              <span>TOTAL</span>
              <span>UGX {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center pt-3 mt-3" style={{ borderTop: '2px dashed #e2e8f0' }}>
            <div className="text-xs font-bold mb-1" style={{ color: '#059669' }}>Thank you for choosing Don Suites!</div>
            <div className="text-[9.5px] leading-relaxed" style={{ color: '#94a3b8' }}>
              We hope to serve you again.<br />For inquiries call +256 741 445 555
            </div>
            <div className="text-[8px] mt-2" style={{ color: '#cbd5e1' }}>Designed by Nobtech World | +256 760 399 849</div>
          </div>
        </div>

        <div className="text-center p-4" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          {paymentStatus === 'unpaid' && (
            <form action={handleMarkPaid} className="inline-block mr-2">
              <input type="hidden" name="orderId" value={id} />
              <input type="hidden" name="type" value={type} />
              <button type="submit" className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <i className="fas fa-check-circle mr-1"></i> Mark as Paid
              </button>
            </form>
          )}
          {paymentStatus === 'paid' && (
            <span className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold border-2" style={{ background: '#f0fdf4', color: '#059669', borderColor: '#10b981' }}>
              <i className="fas fa-check-circle mr-1"></i> PAID
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white ml-2"
            style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c)' }}
          >
            <i className="fas fa-print mr-1"></i> Print Receipt
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: #fff !important; padding: 0 !important; margin: 0 !important; }
          div[style*="box-shadow"] { box-shadow: none !important; border-radius: 0 !important; width: 80mm !important; }
          button, form { display: none !important; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>
    </div>
  );
}
