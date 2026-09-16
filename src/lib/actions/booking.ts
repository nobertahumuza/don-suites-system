'use server';

import prisma from '@/lib/db';
import { getSession, requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { calculateTaxes } from '@/lib/actions/taxes';

export async function createBooking(data: {
  guest_full_name: string;
  guest_phone: string;
  guest_email: string;
  guest_id_type: string;
  guest_id_number: string;
  guest_nationality: string;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  amount: number;
  payment_method: string;
  notes: string;
  deposit_amount?: number;
}) {
  const user = await requireRole(['admin', 'reception']);

  const {
    guest_full_name,
    guest_phone,
    guest_email,
    guest_id_type,
    guest_id_number,
    guest_nationality,
    room_id,
    check_in_date,
    check_out_date,
    amount,
    payment_method,
    notes,
    deposit_amount,
  } = data;

  if (!guest_full_name) throw new Error('Guest name is required');
  if (!guest_phone) throw new Error('Phone number is required');
  if (!room_id) throw new Error('Room is required');
  if (!check_in_date) throw new Error('Check-in date is required');
  if (!check_out_date) throw new Error('Check-out date is required');
  if (check_out_date <= check_in_date) throw new Error('Check-out must be after check-in');

  const room = await prisma.rooms.findFirst({
    where: { id: room_id, status: 'available' },
    include: { room_types: true },
  });
  if (!room) throw new Error('Selected room is not available');

  const ci = new Date(check_in_date);
  const co = new Date(check_out_date);
  const nights = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
  const baseAmount = amount > 0 ? amount : nights * Number(room.room_types.price);
  const taxes = await calculateTaxes(baseAmount);
  const total_amount = taxes.total_with_tax;

  const result = await prisma.$transaction(async (tx) => {
    const guest = await tx.guests.create({
      data: {
        full_name: guest_full_name,
        phone: guest_phone,
        email: guest_email || null,
        id_type: guest_id_type || 'passport',
        id_number: guest_id_number || null,
        nationality: guest_nationality || null,
        registered_by: user.id,
      },
    });

    const booking = await tx.bookings.create({
      data: {
        guest_id: guest.id,
        room_id,
        check_in_date: new Date(check_in_date),
        check_out_date: new Date(check_out_date),
        total_amount,
        amount_paid: deposit_amount != null ? deposit_amount : 0,
        status: 'confirmed',
        payment_method: payment_method || 'cash',
        payment_status: deposit_amount != null
          ? (deposit_amount >= total_amount ? 'paid' : 'partial')
          : 'unpaid',
        deposit_amount: deposit_amount || 0,
        notes: notes || null,
        nights,
        created_by: user.id,
      },
    });

    await tx.financial_transactions.create({
      data: {
        type: 'income',
        category: 'accommodation',
        description: `Room ${room.room_number} - Booking #${booking.id} | Subtotal: ${baseAmount} | S/C: ${taxes.service_charge} | VAT: ${taxes.vat_amount}`,
        amount: deposit_amount != null ? deposit_amount : total_amount,
        reference_type: 'booking',
        reference_id: booking.id,
        payment_method: payment_method || 'cash',
        transaction_date: new Date(),
        recorded_by: user.id,
      },
    });

    await tx.rooms.update({
      where: { id: room_id },
      data: { status: 'reserved' },
    });

    return {
      booking_id: booking.id,
      total_amount,
      nights,
      tax_breakdown: taxes,
    };
  });

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  return { success: true, ...result };
}

export async function checkIn(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findFirst({
    where: { id: bookingId, status: 'confirmed' },
  });
  if (!booking) throw new Error('Booking not found or already checked in');

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'checked_in', actual_check_in: new Date() },
    }),
    prisma.rooms.update({
      where: { id: booking.room_id! },
      data: { status: 'occupied' },
    }),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');
  return { success: true };
}

export async function checkOut(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findFirst({
    where: { id: bookingId, status: 'checked_in' },
    include: { rooms: true },
  });
  if (!booking) throw new Error('Booking not found or already checked out');

  const taxes = await calculateTaxes(Number(booking.total_amount));

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'checked_out', actual_check_out: new Date() },
    }),
    prisma.rooms.update({
      where: { id: booking.room_id! },
      data: { status: 'available' },
    }),
    prisma.financial_transactions.create({
      data: {
        type: 'income',
        category: 'accommodation',
        description: `Room ${booking.rooms?.room_number} - Check-out | Subtotal: ${taxes.subtotal} | S/C: ${taxes.service_charge} | VAT: ${taxes.vat_amount}`,
        amount: taxes.total_with_tax,
        reference_type: 'booking',
        reference_id: bookingId,
        payment_method: 'cash',
        transaction_date: new Date(),
        recorded_by: user.id,
      },
    }),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');
  return { success: true };
}

export async function updateBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });

  await prisma.bookings.update({
    where: { id: bookingId },
    data: { status },
  });

  if (status === 'cancelled' && booking?.room_id) {
    await prisma.rooms.update({
      where: { id: booking.room_id },
      data: { status: 'available' },
    });
  }

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');
  return { success: true };
}

export async function updateRoomStatus(roomId: number, status: string) {
  const user = await requireRole(['admin', 'reception']);

  const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'out_of_service'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  await prisma.rooms.update({
    where: { id: roomId },
    data: { status },
  });
  revalidatePath('/rooms');
  return { success: true };
}

export async function createRoom(data: {
  room_number: string;
  room_type_id: number;
  status: string;
}) {
  const user = await requireRole(['admin', 'reception']);

  const { room_number, room_type_id, status } = data;

  if (!room_number) throw new Error('Room number is required');
  if (!room_type_id) throw new Error('Room type is required');

  const existing = await prisma.rooms.findUnique({
    where: { room_number: room_number.toUpperCase() },
  });
  if (existing) {
    throw new Error(`Room ${room_number.toUpperCase()} already exists`);
  }

  await prisma.rooms.create({
    data: {
      room_number: room_number.toUpperCase(),
      room_type_id,
      status: status || 'available',
    },
  });

  revalidatePath('/rooms');
  return { success: true };
}

export async function updateRoom(data: {
  room_id: number;
  room_number: string;
  room_type_id: number;
  status: string;
}) {
  const user = await requireRole(['admin', 'reception']);

  const { room_id, room_number, room_type_id, status } = data;

  if (!room_number) throw new Error('Room number is required');
  if (!room_type_id) throw new Error('Room type is required');

  await prisma.rooms.update({
    where: { id: room_id },
    data: {
      room_number: room_number.toUpperCase(),
      room_type_id,
      status,
    },
  });

  revalidatePath('/rooms');
  return { success: true };
}

export async function cancelBooking(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    }),
    ...(booking?.room_id
      ? [
          prisma.rooms.update({
            where: { id: booking.room_id },
            data: { status: 'available' },
          }),
        ]
      : []),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  return { success: true };
}

export async function getRoomTypes() {
  const roomTypes = await prisma.room_types.findMany({
    include: { _count: { select: { rooms: true } } },
    orderBy: { name: 'asc' },
  });

  return roomTypes.map((rt) => ({
    id: rt.id,
    name: rt.name,
    price: Number(rt.price),
    cooking_space_price: Number(rt.cooking_space_price ?? 0),
    description: rt.description,
    total_rooms: rt._count.rooms,
    created_at: rt.created_at,
  }));
}

export async function createRoomType(data: {
  name: string;
  price: number;
  cooking_space_price: number;
  description: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { name, price, cooking_space_price, description } = data;
  if (!name) throw new Error('Name is required');
  if (!price || price <= 0) throw new Error('Price must be greater than 0');

  await prisma.room_types.create({
    data: {
      name,
      price,
      cooking_space_price: cooking_space_price || 0,
      description: description || null,
    },
  });

  revalidatePath('/rooms/types');
  revalidatePath('/rooms');
  return { success: true };
}

export async function updateRoomType(roomTypeId: number, data: {
  name: string;
  price: number;
  cooking_space_price: number;
  description: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { name, price, cooking_space_price, description } = data;
  if (!name) throw new Error('Name is required');
  if (!price || price <= 0) throw new Error('Price must be greater than 0');

  await prisma.room_types.update({
    where: { id: roomTypeId },
    data: {
      name,
      price,
      cooking_space_price: cooking_space_price || 0,
      description: description || null,
    },
  });

  revalidatePath('/rooms/types');
  revalidatePath('/rooms');
  return { success: true };
}

export async function deleteRoomType(roomTypeId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const roomType = await prisma.room_types.findUnique({
    where: { id: roomTypeId },
    include: { _count: { select: { rooms: true } } },
  });
  if (!roomType) throw new Error('Room type not found');
  if (roomType._count.rooms > 0) throw new Error('Cannot delete room type with linked rooms');

  await prisma.room_types.delete({ where: { id: roomTypeId } });
  revalidatePath('/rooms/types');
  revalidatePath('/rooms');
  return { success: true };
}

export async function updateBooking(bookingId: number, data: {
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  total_amount: number;
  deposit_amount: number;
  notes: string;
}) {
  const user = await requireRole(['admin', 'reception']);

  const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    throw new Error('Only pending or confirmed bookings can be edited');
  }

  const { room_id, check_in_date, check_out_date, nights, total_amount, deposit_amount, notes } = data;

  if (!room_id) throw new Error('Room is required');
  if (!check_in_date) throw new Error('Check-in date is required');
  if (!check_out_date) throw new Error('Check-out date is required');

  await prisma.bookings.update({
    where: { id: bookingId },
    data: {
      room_id,
      check_in_date: new Date(check_in_date),
      check_out_date: new Date(check_out_date),
      nights,
      total_amount,
      deposit_amount: deposit_amount || 0,
      notes: notes || null,
    },
  });

  if (booking.room_id !== room_id) {
    await prisma.$transaction(async (tx) => {
      if (booking.room_id) {
        await tx.rooms.update({ where: { id: booking.room_id }, data: { status: 'available' } });
      }
      await tx.rooms.update({ where: { id: room_id }, data: { status: 'reserved' } });
    });
  }

  revalidatePath('/bookings');
  revalidatePath('/bookings/edit');
  return { success: true };
}

export async function recordPartialPayment(bookingId: number, data: {
  amount: number;
  payment_method: string;
  reference_number: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');

  const { amount, payment_method, reference_number } = data;
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');

  const newAmountPaid = Number(booking.amount_paid || 0) + amount;

  await prisma.$transaction([
    prisma.financial_transactions.create({
      data: {
        type: 'income',
        category: 'accommodation',
        description: `Partial payment for Booking #${bookingId}${reference_number ? ` - Ref: ${reference_number}` : ''}`,
        amount,
        reference_type: 'booking',
        reference_id: bookingId,
        payment_method: payment_method || 'cash',
        transaction_date: new Date(),
        recorded_by: user.id,
      },
    }),
    prisma.bookings.update({
      where: { id: bookingId },
      data: {
        amount_paid: newAmountPaid,
        payment_status: newAmountPaid >= Number(booking.total_amount) ? 'paid' : 'partial',
      },
    }),
  ]);

  revalidatePath('/bookings');
  revalidatePath('/bookings/checkout');
  return { success: true };
}

export async function transferBooking(bookingId: number, newRoomId: number) {
  const user = await requireRole(['admin', 'reception']);

  const booking = await prisma.bookings.findFirst({
    where: { id: bookingId, status: 'checked_in' },
    include: { rooms: { include: { room_types: true } }, guests: true },
  });
  if (!booking) throw new Error('Booking not found or not checked in');

  const newRoom = await prisma.rooms.findFirst({
    where: { id: newRoomId, status: 'available' },
    include: { room_types: true },
  });
  if (!newRoom) throw new Error('Selected room is not available');

  if (booking.room_id === newRoomId) throw new Error('Guest is already in this room');

  await prisma.$transaction([
    prisma.rooms.update({
      where: { id: booking.room_id! },
      data: { status: 'cleaning' },
    }),
    prisma.rooms.update({
      where: { id: newRoomId },
      data: { status: 'occupied' },
    }),
    prisma.bookings.update({
      where: { id: bookingId },
      data: { room_id: newRoomId },
    }),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/transfer');

  return {
    success: true,
    from_room: booking.rooms?.room_number,
    to_room: newRoom.room_number,
    old_price: Number(booking.rooms?.room_types?.price ?? 0),
    new_price: Number(newRoom.room_types.price),
  };
}

export async function createWalkInBooking(data: {
  guest_name: string;
  guest_phone: string;
  room_id: number;
  nights: number;
  payment_method: string;
  amount_paid: number;
}) {
  const user = await requireRole(['admin', 'reception']);

  const { guest_name, guest_phone, room_id, nights, payment_method, amount_paid } = data;

  if (!guest_name) throw new Error('Guest name is required');
  if (!room_id) throw new Error('Room is required');
  if (!nights || nights < 1) throw new Error('Nights must be at least 1');

  const room = await prisma.rooms.findFirst({
    where: { id: room_id, status: 'available' },
    include: { room_types: true },
  });
  if (!room) throw new Error('Selected room is not available');

  const baseAmount = nights * Number(room.room_types.price);
  const taxes = await calculateTaxes(baseAmount);
  const total_amount = taxes.total_with_tax;

  const today = new Date();
  const checkOut = new Date(today);
  checkOut.setDate(checkOut.getDate() + nights);

  const result = await prisma.$transaction(async (tx) => {
    const guest = await tx.guests.create({
      data: {
        full_name: guest_name,
        phone: guest_phone || null,
        registered_by: user.id,
      },
    });

    const booking = await tx.bookings.create({
      data: {
        guest_id: guest.id,
        room_id,
        check_in_date: today,
        check_out_date: checkOut,
        total_amount,
        amount_paid: amount_paid || 0,
        status: 'confirmed',
        payment_method: payment_method || 'cash',
        payment_status: (amount_paid || 0) >= total_amount ? 'paid' : 'partial',
        nights,
        actual_check_in: today,
        created_by: user.id,
      },
    });

    await tx.rooms.update({
      where: { id: room_id },
      data: { status: 'reserved' },
    });

    return {
      booking_id: booking.id,
      total_amount,
      room_number: room.room_number,
      room_type: room.room_types.name,
      guest_id: guest.id,
      tax_breakdown: taxes,
    };
  });

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  return { success: true, ...result };
}

export async function getAvailableRooms() {
  const rooms = await prisma.rooms.findMany({
    where: { status: 'available' },
    include: { room_types: true },
    orderBy: { room_number: 'asc' },
  });

  return rooms.map((r) => ({
    id: r.id,
    room_number: r.room_number,
    room_type: r.room_types.name,
    price: Number(r.room_types.price),
    cooking_space_price: Number(r.room_types.cooking_space_price ?? 0),
  }));
}

export async function getBookingForTransfer(bookingId: number) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      guests: true,
      rooms: { include: { room_types: true } },
    },
  });

  if (!booking) throw new Error('Booking not found');

  return {
    id: booking.id,
    guest_name: booking.guests?.full_name ?? '',
    guest_phone: booking.guests?.phone ?? '',
    room_id: booking.room_id,
    room_number: booking.rooms?.room_number ?? '',
    room_type: booking.rooms?.room_types?.name ?? '',
    room_price: Number(booking.rooms?.room_types?.price ?? 0),
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    actual_check_in: booking.actual_check_in,
    total_amount: Number(booking.total_amount),
    status: booking.status,
  };
}

export async function processCheckout(bookingId: number, actualCheckOutTime: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findFirst({
    where: { id: bookingId, status: 'checked_in' },
    include: { rooms: { include: { room_types: true } } },
  });
  if (!booking) throw new Error('Booking not found or already checked out');

  const checkoutTime = new Date(actualCheckOutTime);
  const checkoutHour = checkoutTime.getHours();
  const checkoutMinute = checkoutTime.getMinutes();
  const checkoutTotalMinutes = checkoutHour * 60 + checkoutMinute;

  const LATE_CHECKOUT_THRESHOLD = 12 * 60; // 12:00 PM in minutes
  const LATE_FEE_PERCENTAGE = 0.25;

  let lateFee = 0;
  let lateFeeNote = '';

  if (checkoutTotalMinutes > LATE_CHECKOUT_THRESHOLD) {
    const nightlyRate = Number(booking.rooms?.room_types?.price ?? 0);
    lateFee = Math.round(nightlyRate * LATE_FEE_PERCENTAGE);
    lateFeeNote = `Late checkout fee (after 12:00 PM): UGX ${lateFee.toLocaleString()}`;
  }

  const newTotal = Number(booking.total_amount) + lateFee;
  const newAmountPaid = Number(booking.amount_paid) + lateFee;

  const taxes = await calculateTaxes(newTotal);

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: 'checked_out',
        actual_check_out: checkoutTime,
        total_amount: newTotal,
        amount_paid: newAmountPaid,
        additional_charges: Number(booking.additional_charges || 0) + lateFee,
        notes: booking.notes
          ? `${booking.notes}\n${lateFeeNote}`
          : lateFeeNote || booking.notes,
      },
    }),
    prisma.rooms.update({
      where: { id: booking.room_id! },
      data: { status: 'available' },
    }),
    prisma.financial_transactions.create({
      data: {
        type: 'income',
        category: 'accommodation',
        description: `Room ${booking.rooms?.room_number} - Check-out${lateFeeNote ? ` | ${lateFeeNote}` : ''} | Subtotal: ${taxes.subtotal} | S/C: ${taxes.service_charge} | VAT: ${taxes.vat_amount}`,
        amount: taxes.total_with_tax,
        reference_type: 'booking',
        reference_id: bookingId,
        payment_method: 'cash',
        transaction_date: new Date(),
        recorded_by: user.id,
      },
    }),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');

  return {
    success: true,
    late_fee: lateFee,
    late_fee_note: lateFeeNote,
    new_total: newTotal,
  };
}

export async function processCheckIn(bookingId: number, actualCheckInTime: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findFirst({
    where: { id: bookingId, status: 'confirmed' },
    include: { rooms: { include: { room_types: true } } },
  });
  if (!booking) throw new Error('Booking not found or already checked in');

  const checkinTime = new Date(actualCheckInTime);
  const checkinHour = checkinTime.getHours();
  const checkinMinute = checkinTime.getMinutes();
  const checkinTotalMinutes = checkinHour * 60 + checkinMinute;

  const EARLY_CHECKIN_THRESHOLD = 12 * 60; // 12:00 PM in minutes
  const EARLY_FEE_PERCENTAGE = 0.25;

  let earlyFee = 0;
  let earlyFeeNote = '';

  if (checkinTotalMinutes < EARLY_CHECKIN_THRESHOLD) {
    const nightlyRate = Number(booking.rooms?.room_types?.price ?? 0);
    earlyFee = Math.round(nightlyRate * EARLY_FEE_PERCENTAGE);
    earlyFeeNote = `Early check-in fee (before 12:00 PM): UGX ${earlyFee.toLocaleString()}`;
  }

  const newTotal = Number(booking.total_amount) + earlyFee;

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: 'checked_in',
        actual_check_in: checkinTime,
        total_amount: newTotal,
        additional_charges: Number(booking.additional_charges || 0) + earlyFee,
        notes: booking.notes
          ? `${booking.notes}\n${earlyFeeNote}`
          : earlyFeeNote || booking.notes,
      },
    }),
    prisma.rooms.update({
      where: { id: booking.room_id! },
      data: { status: 'occupied' },
    }),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');

  return {
    success: true,
    early_fee: earlyFee,
    early_fee_note: earlyFeeNote,
    new_total: newTotal,
  };
}
