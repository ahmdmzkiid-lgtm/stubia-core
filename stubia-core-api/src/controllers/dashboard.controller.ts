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
      prisma.user.count({ where: { isActive: true } }),
    ]);

    // 2. Personal Questions Statistics for current user
    const [userQuestionsCount, userQuestionsApproved, userQuestionsDraft] = await Promise.all([
      prisma.question.count({ where: { createdById: userId } }),
      prisma.question.count({ where: { createdById: userId, status: { in: ['APPROVED', 'PUBLISHED'] } } }),
      prisma.question.count({ where: { createdById: userId, status: 'DRAFT' } }),
    ]);

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

    // 4. Global Tasks by status
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

    // 5. Personal Tasks for current user (My Tasks)
    const [myTasksList, myUpcomingTasks, myRecentSubmissions] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId },
        select: { status: true },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: 'DONE' },
        },
        take: 5,
        orderBy: [{ deadline: 'asc' }, { priority: 'asc' }],
        include: {
          assignee: { select: { name: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ['REVIEW', 'DONE'] },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { name: true } },
        },
      }),
    ]);

    const myTasksStats = {
      total: myTasksList.length,
      todo: myTasksList.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'BACKLOG').length,
      review: myTasksList.filter((t) => t.status === 'REVIEW').length,
      done: myTasksList.filter((t) => t.status === 'DONE').length,
    };

    // 6. Subtest Distribution for Questions
    const subtestGroups = await prisma.question.groupBy({
      by: ['subtes'],
      _count: { _all: true },
      orderBy: {
        _count: { subtes: 'desc' },
      },
      take: 8,
    });
    const subtestDistribution = subtestGroups.map((s) => ({
      name: s.subtes,
      count: s._count._all,
    }));

    // 7. Global Pending Review Tasks (for Managers & Super Admin)
    const pendingReviewTasks = await prisma.task.findMany({
      where: { status: 'REVIEW' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { name: true } },
      },
    });

    // 8. Finance Ledger aggregated cashflow balance & categories
    const [cashflowSums, categorySums, recentCashflowEntries] = await Promise.all([
      prisma.cashflowEntry.groupBy({
        by: ['type'],
        _sum: { amount: true },
      }),
      prisma.cashflowEntry.groupBy({
        by: ['category'],
        _sum: { amount: true },
      }),
      prisma.cashflowEntry.findMany({
        take: 6,
        orderBy: { entryDate: 'desc' },
        include: {
          recordedBy: { select: { name: true } },
        },
      }),
    ]);

    let totalDebit = 0;
    let totalKredit = 0;
    cashflowSums.forEach((item) => {
      if (item.type === 'debit') totalDebit = item._sum.amount || 0;
      if (item.type === 'kredit') totalKredit = item._sum.amount || 0;
    });
    const cashflowBalance = totalDebit - totalKredit;

    const categoryBreakdown = categorySums.map((c) => ({
      category: c.category,
      amount: c._sum.amount || 0,
    }));

    // 9. HR & Ops: Team Workload
    const teamMembers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        tasksAssigned: {
          select: { status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const teamWorkload = teamMembers.map((m) => {
      const active = m.tasksAssigned.filter((t) => t.status !== 'DONE').length;
      const done = m.tasksAssigned.filter((t) => t.status === 'DONE').length;
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        totalTasks: m.tasksAssigned.length,
        activeTasks: active,
        doneTasks: done,
      };
    });

    // 10. Upcoming Events
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 5,
      orderBy: { startDate: 'asc' },
      include: {
        pic: { select: { name: true } },
      },
    });

    // 11. AI Generation costs sum
    const aiLogAggregate = await prisma.aIGenerationLog.aggregate({
      _sum: { costEstimateUsd: true, tokensUsed: true },
    });
    const totalAiCost = aiLogAggregate._sum.costEstimateUsd || 0.0;
    const totalTokensUsed = aiLogAggregate._sum.tokensUsed || 0;

    // Send complete role-tailored real-time statistics
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
          questionsApproved: userQuestionsApproved,
          questionsDraft: userQuestionsDraft,
          tasksAssigned: myTasksStats.total,
          myTasksStats,
        },
        difficultyDistribution,
        taskDistribution,
        subtestDistribution,
        myUpcomingTasks: myUpcomingTasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          type: t.type,
          deadline: t.deadline,
          proofUrl: t.proofUrl,
          proofName: t.proofName,
          assignee: (t as any).assignee?.name || 'Saya',
        })),
        myRecentSubmissions: myRecentSubmissions.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          type: t.type,
          deadline: t.deadline,
          proofUrl: t.proofUrl,
          proofName: t.proofName,
          assignee: (t as any).assignee?.name || 'Saya',
        })),
        pendingReviewTasks: pendingReviewTasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          type: t.type,
          deadline: t.deadline,
          proofUrl: t.proofUrl,
          proofName: t.proofName,
          assignee: (t as any).assignee?.name || 'Unassigned',
        })),
        finance: {
          debit: totalDebit,
          kredit: totalKredit,
          balance: cashflowBalance,
          categoryBreakdown,
          recentTransactions: recentCashflowEntries.map((e) => ({
            id: e.id,
            description: e.description,
            amount: e.amount,
            type: e.type,
            category: e.category,
            entryDate: e.entryDate,
            recordedBy: e.recordedBy?.name || 'Sistem',
          })),
        },
        hrOps: {
          teamWorkload,
          upcomingEvents: upcomingEvents.map((ev) => ({
            id: ev.id,
            title: ev.title,
            type: ev.type,
            startDate: ev.startDate,
            endDate: ev.endDate,
            status: ev.status,
            pic: ev.pic?.name || 'Belum ada PIC',
          })),
        },
        aiUsage: {
          cost: totalAiCost,
          tokens: totalTokensUsed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
