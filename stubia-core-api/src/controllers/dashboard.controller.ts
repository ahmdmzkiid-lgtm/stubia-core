import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!;

    // 1. Core aggregations (Total Questions, Tasks, Events, Users)
    const [
      totalQuestions,
      totalTasks,
      totalEvents,
      totalUsers,
    ] = await Promise.all([
      prisma.question.count(),
      prisma.task.count(),
      prisma.event.count(),
      prisma.user.count(),
    ]);

    // 2. Questions created by this user vs total
    const userQuestionsCount = await prisma.question.count({
      where: { createdById: userId },
    });

    // 3. Questions by difficulty (EASY, MEDIUM, HOTS)
    const difficultyGroup = await prisma.question.groupBy({
      by: ['difficulty'],
      _count: { _all: true },
    });

    const difficultyDistribution = {
      EASY: 0,
      MEDIUM: 0,
      HOTS: 0,
    };
    difficultyGroup.forEach((g) => {
      if (g.difficulty in difficultyDistribution) {
        difficultyDistribution[g.difficulty as keyof typeof difficultyDistribution] = g._count._all;
      }
    });

    // 4. Tasks by status
    const taskGroup = await prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const taskDistribution = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    };
    taskGroup.forEach((g) => {
      if (g.status in taskDistribution) {
        taskDistribution[g.status as keyof typeof taskDistribution] = g._count._all;
      }
    });

    // 5. Tasks assigned to current user
    const userTasksCount = await prisma.task.count({
      where: { assigneeId: userId },
    });

    // 6. Finance Ledger aggregated cashflow balance (Debit vs Kredit)
    const cashflowSums = await prisma.cashflowEntry.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    let totalDebit = 0;
    let totalKredit = 0;
    cashflowSums.forEach((item) => {
      if (item.type === 'debit') totalDebit = item._sum.amount || 0;
      if (item.type === 'kredit') totalKredit = item._sum.amount || 0;
    });
    const cashflowBalance = totalDebit - totalKredit;

    // 7. AI Generation costs sum
    const aiLogAggregate = await prisma.aIGenerationLog.aggregate({
      _sum: { costEstimateUsd: true, tokensUsed: true },
    });
    const totalAiCost = aiLogAggregate._sum.costEstimateUsd || 0.0;
    const totalTokensUsed = aiLogAggregate._sum.tokensUsed || 0;

    // 8. Recent activity feed (recent questions + recent finance + recent tasks)
    const [recentQuestions, recentTasks] = await Promise.all([
      prisma.question.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.task.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { assignee: { select: { name: true } } },
      }),
    ]);

    // Send role-tailored real-time statistics
    res.json({
      success: true,
      data: {
        totals: {
          questions: totalQuestions,
          tasks: totalTasks,
          events: totalEvents,
          users: totalUsers,
        },
        userStats: {
          questionsCreated: userQuestionsCount,
          tasksAssigned: userTasksCount,
        },
        difficultyDistribution,
        taskDistribution,
        finance: {
          debit: totalDebit,
          kredit: totalKredit,
          balance: cashflowBalance,
        },
        aiUsage: {
          cost: totalAiCost,
          tokens: totalTokensUsed,
        },
        recentActivities: {
          questions: recentQuestions.map((q) => ({
            id: q.id,
            title: q.soalText,
            creator: q.createdBy.name,
            time: q.createdAt,
            status: q.status,
          })),
          tasks: recentTasks.map((t) => ({
            id: t.id,
            title: t.title,
            assignee: t.assignee?.name || 'Unassigned',
            time: t.createdAt,
            status: t.status,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
