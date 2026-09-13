'use client';

type ReceiptItem = {
  item_name: string;
  quantity: number;
  total_price: number;
};

type ReceiptData = {
  orderLabel: string;
  date: string;
  guestName: string;
  roomNumber: string;
  orderType: string;
  servedBy: string;
  paymentStatus: string;
  subtotal: number;
  surcharge: number;
  total: number;
  status: string;
  items: ReceiptItem[];
  orderId: number;
  type: string;
};

export default function ReceiptView({
  data,
  onHandleMarkPaid,
}: {
  data: ReceiptData;
  onHandleMarkPaid: (formData: FormData) => Promise<void>;
}) {
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
            {data.orderLabel}
          </div>

          <div className="flex justify-between text-[10.5px] leading-relaxed mb-2.5" style={{ color: '#475569' }}>
            <div>
              <div><span style={{ color: '#94a3b8' }}>Date:</span> {data.date}</div>
              <div><span style={{ color: '#94a3b8' }}>Guest:</span> {data.guestName}</div>
              {data.roomNumber && <div><span style={{ color: '#94a3b8' }}>Room:</span> {data.roomNumber}</div>}
              <div><span style={{ color: '#94a3b8' }}>Type:</span> {data.orderType}</div>
              <div className="mt-1">
                <span style={{ color: '#94a3b8' }}>Status:</span>{' '}
                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-xl uppercase tracking-wide ${
                  data.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  data.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                  data.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                  data.status === 'served' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {data.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div><span style={{ color: '#94a3b8' }}>Served by:</span></div>
              <div className="font-semibold">{data.servedBy}</div>
              <div className="mt-1">
                {data.paymentStatus === 'paid' ? (
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">PAID</span>
                ) : (
                  <span className="inline-block bg-red-100 text-red-700 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">UNPAID</span>
                )}
              </div>
            </div>
          </div>

          <hr className="my-2" style={{ border: 'none', borderTop: '1px dashed #e2e8f0' }} />

          <div className="my-2">
            {data.items.map((item: ReceiptItem, idx: number) => (
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
              <span>UGX {data.subtotal.toLocaleString()}</span>
            </div>
            {data.surcharge > 0 && (
              <div className="flex justify-between text-[11px] mb-1" style={{ color: '#475569' }}>
                <span>Room Service Fee</span>
                <span>UGX {data.surcharge.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[14px] font-extrabold pt-2 mt-2" style={{ color: '#0f1a3c', borderTop: '2px solid #0f1a3c' }}>
              <span>TOTAL</span>
              <span>UGX {data.total.toLocaleString()}</span>
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
          {data.paymentStatus === 'unpaid' && (
            <form action={onHandleMarkPaid} className="inline-block mr-2">
              <input type="hidden" name="orderId" value={data.orderId} />
              <input type="hidden" name="type" value={data.type} />
              <button type="submit" className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <i className="fas fa-check-circle mr-1"></i> Mark as Paid
              </button>
            </form>
          )}
          {data.paymentStatus === 'paid' && (
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
