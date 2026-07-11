import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CashflowType, UserRole } from '@prisma/client';

export const getCashflowEntries = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { category, type } = req.query;

    const where: any = {};
    if (category) where.category = category as string;
    if (type) where.type = type as CashflowType;

    const entries = await prisma.cashflowEntry.findMany({
      where,
      include: {
        recordedBy: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { entryDate: 'desc' },
    });

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

export const createCashflowEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { type, amount, category, description } = req.body;

    if (!type || !amount || !category || !description) {
      throw new AppError('Data transaksi tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const entry = await prisma.cashflowEntry.create({
      data: {
        type: type as CashflowType,
        amount: parseFloat(amount),
        category,
        description,
        recordedById: req.user.userId,
      },
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi keuangan berhasil dicatat',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const generatePayroll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      throw new AppError('Periode bulan dan tahun wajib dikirimkan', 400, 'VALIDATION_ERROR');
    }

    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);

    // Fetch all content creators
    const writers = await prisma.user.findMany({
      where: { role: UserRole.content_creator },
    });

    const generatedRecords = [];

    for (const writer of writers) {
      // Count approved questions created by this writer in the target period
      const approvedCount = await prisma.question.count({
        where: {
          createdById: writer.id,
          status: 'APPROVED',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const baseSalary = 1500000;
      const soalIncentive = 15000;
      const totalAmount = baseSalary + approvedCount * soalIncentive;

      // Upsert payroll record
      const existing = await prisma.payrollRecord.findFirst({
        where: {
          userId: writer.id,
          periodMonth: parsedMonth,
          periodYear: parsedYear,
        },
      });

      let record;
      if (existing) {
        if (existing.status === 'PAID') {
          // Skip updating paid payrolls
          generatedRecords.push(existing);
          continue;
        }
        record = await prisma.payrollRecord.update({
          where: { id: existing.id },
          data: {
            baseSalary,
            soalCount: approvedCount,
            soalIncentive,
            totalAmount,
          },
        });
      } else {
        record = await prisma.payrollRecord.create({
          data: {
            userId: writer.id,
            periodMonth: parsedMonth,
            periodYear: parsedYear,
            baseSalary,
            soalCount: approvedCount,
            soalIncentive,
            totalAmount,
            status: 'UNPAID',
          },
        });
      }

      generatedRecords.push(record);
    }

    res.json({
      success: true,
      message: `Payroll periode ${parsedMonth}/${parsedYear} berhasil dikompilasi`,
      data: generatedRecords,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrolls = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query;

    const where: any = {};
    if (month) where.periodMonth = parseInt(month as string);
    if (year) where.periodYear = parseInt(year as string);

    const payrolls = await prisma.payrollRecord.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { totalAmount: 'desc' },
    });

    res.json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    next(error);
  }
};

export const payPayroll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { id } = req.params;

    const payroll = await prisma.payrollRecord.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });

    if (!payroll) {
      throw new AppError('Record payroll tidak ditemukan', 404, 'NOT_FOUND');
    }

    if (payroll.status === 'PAID') {
      throw new AppError('Payroll sudah dibayarkan', 400, 'ALREADY_PAID');
    }

    // Execute in transaction
    const [updatedPayroll, cashflowEntry] = await prisma.$transaction([
      prisma.payrollRecord.update({
        where: { id },
        data: { status: 'PAID' },
      }),
      prisma.cashflowEntry.create({
        data: {
          type: CashflowType.kredit,
          amount: payroll.totalAmount,
          category: 'Payroll',
          description: `Pembayaran payroll penulis ${payroll.user.name} periode ${payroll.periodMonth}/${payroll.periodYear}`,
          refId: payroll.id,
          refType: 'PAYROLL',
          recordedById: req.user.userId,
        },
      }),
    ]);

    res.json({
      success: true,
      message: `Payroll untuk ${payroll.user.name} berhasil dibayarkan dan dibukukan`,
      data: updatedPayroll,
    });
  } catch (error) {
    next(error);
  }
};

export const getFinanceAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const entries = await prisma.cashflowEntry.findMany({
      orderBy: { entryDate: 'asc' },
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    const categoryTotals: Record<string, number> = {
      Operasional: 0,
      Marketing: 0,
      Payroll: 0,
      Revenue: 0,
      AI_COST: 0,
    };

    const costLedgerOverTime: Array<{ date: string; amount: number }> = [];

    entries.forEach((e) => {
      const amt = e.amount;
      if (e.type === CashflowType.debit) {
        totalInflow += amt;
      } else {
        totalOutflow += amt;
      }

      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amt;

      if (e.category === 'AI_COST') {
        const dateStr = e.entryDate.toISOString().split('T')[0];
        costLedgerOverTime.push({ date: dateStr, amount: amt });
      }
    });

    const netIncome = totalInflow - totalOutflow;

    const categoryBreakdown = Object.keys(categoryTotals).map((cat) => ({
      name: cat,
      value: Math.round(categoryTotals[cat]),
    }));

    res.json({
      success: true,
      data: {
        totalInflow,
        totalOutflow,
        netIncome,
        categoryBreakdown,
        costLedgerOverTime: costLedgerOverTime.slice(-10), // last 10 transactions
      },
    });
  } catch (error) {
    next(error);
  }
};
