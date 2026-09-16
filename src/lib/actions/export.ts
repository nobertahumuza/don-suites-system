'use client';

export function exportReportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printReport() {
  window.print();
}

export function exportBookingCSV(bookings: Array<{
  id: number;
  guest_name: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
  amount_paid: number;
}>, filename: string) {
  const data = bookings.map((b) => ({
    'Booking ID': b.id,
    Guest: b.guest_name,
    Room: b.room_number,
    'Check-in': b.check_in_date,
    'Check-out': b.check_out_date,
    Status: b.status,
    'Total Amount': b.total_amount,
    'Amount Paid': b.amount_paid,
  }));

  exportReportToCSV(data as Record<string, unknown>[], filename);
}
