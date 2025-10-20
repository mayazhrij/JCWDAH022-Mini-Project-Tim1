import { Request, Response } from 'express';
import prisma  from '../libs/prisma';
import { sendEmail } from '../services/email.service';
import { rollbackTransaction } from '../services/rollback.service';
import { AuthRequest } from '../types/auth';
import { TransactionStatus } from '../../generated/prisma';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user?.userId; // pastikan middleware mengisi req.user.id
    if (!organizerId) return res.status(401).json({ message: 'Unauthorized' });

    const totalEvents = await prisma.event.count({ where: { organizerId } });
    const totalTransactions = await prisma.transaction.count({
      where: { event: { organizerId } },
    });

    // groupBy with totalPrice (schema uses totalPrice)
    // Use enum TransactionStatus.DONE for accepted transactions (schema doesn't have "accepted")
    const revenueRaw = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { event: { organizerId }, status: TransactionStatus.done },
      _sum: { totalPrice: true },
    });

    const revenueByMonth = revenueRaw.map(r => ({
      month: r.createdAt.toISOString().slice(0, 7), // YYYY-MM
      revenue: (r._sum?.totalPrice ?? 0) as number,
    }));

    // events by day
    const eventsByDayRaw = await prisma.event.groupBy({
      by: ['createdAt'],
      where: { organizerId },
      _count: { id: true },
    });

    const eventsByDay = eventsByDayRaw.map(item => ({
      day: item.createdAt.toISOString().split('T')[0],
      count: item._count.id,
    }));

    return res.json({ totalEvents, totalTransactions, revenueByMonth, eventsByDay });
  } catch (err) {
    console.error('getDashboardStats error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user?.userId;
    if (!organizerId) return res.status(401).json({ message: 'Unauthorized' });

    const events = await prisma.event.findMany({ where: { organizerId } });
    res.json(events);
  } catch (err) {
    console.error('getEvents error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...data } = req.body;
    const event = await prisma.event.update({ where: { id }, data });
    res.json(event);
  } catch (err) {
    console.error('updateEvent error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user?.userId;
    if (!organizerId) return res.status(401).json({ message: 'Unauthorized' });

    const transactions = await prisma.transaction.findMany({
      where: { event: { organizerId } },
      include: { event: true, user: true },
    });
    res.json(transactions);
  } catch (err) {
    console.error('getTransactions error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const acceptTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.body;
    // set to 'done' per schema enum
    await prisma.transaction.update({ where: { id }, data: { status: TransactionStatus.done } });

    const transaction = await prisma.transaction.findUnique({ where: { id }, include: { user: true } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    await sendEmail(transaction.user.email, 'Transaction Accepted', 'Your payment is accepted.');
    res.json({ message: 'Accepted' });
  } catch (err) {
    console.error('acceptTransaction error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.body;
    await rollbackTransaction(id); // Restore seats, points, vouchers (ensure function exists)
    await prisma.transaction.update({ where: { id }, data: { status: TransactionStatus.rejected } });

    const transaction = await prisma.transaction.findUnique({ where: { id }, include: { user: true } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    await sendEmail(transaction.user.email, 'Transaction Rejected', 'Your payment is rejected.');
    res.json({ message: 'Rejected' });
  } catch (err) {
    console.error('rejectTransaction error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};