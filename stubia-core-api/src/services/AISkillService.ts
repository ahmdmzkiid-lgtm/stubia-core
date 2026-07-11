import prisma from '../prisma';
import { AISkill } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class AISkillService {
  async getAllSkills(): Promise<AISkill[]> {
    return prisma.aISkill.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSkillById(id: string): Promise<AISkill> {
    const skill = await prisma.aISkill.findUnique({
      where: { id },
    });
    if (!skill || !skill.isActive) {
      throw new AppError('Skill template tidak ditemukan', 404, 'NOT_FOUND');
    }
    return skill;
  }

  async createSkill(data: {
    namaSkill: string;
    subtes: string;
    topikCakupanJson: string[];
    instruksiSoal: string;
    contohSoalJson?: any;
    larangan?: string;
    versi?: string;
    createdById: string;
  }): Promise<AISkill> {
    if (data.instruksiSoal.length < 100) {
      throw new AppError('Instruksi soal minimal 100 karakter untuk kualitas prompt yang baik', 400, 'VALIDATION_ERROR');
    }
    if (data.topikCakupanJson.length === 0) {
      throw new AppError('Minimal harus memasukkan 1 topik cakupan', 400, 'VALIDATION_ERROR');
    }

    return prisma.aISkill.create({
      data: {
        namaSkill: data.namaSkill,
        subtes: data.subtes,
        topikCakupanJson: data.topikCakupanJson,
        instruksiSoal: data.instruksiSoal,
        contohSoalJson: data.contohSoalJson || [],
        formatOutput: 'JSON array of question objects',
        larangan: data.larangan || '',
        versi: data.versi || 'v1.0',
        createdById: data.createdById,
        isActive: true,
      },
    });
  }

  async updateSkill(
    id: string,
    data: {
      namaSkill?: string;
      subtes?: string;
      topikCakupanJson?: string[];
      instruksiSoal?: string;
      contohSoalJson?: any;
      larangan?: string;
      versi?: string;
    }
  ): Promise<AISkill> {
    const skill = await this.getSkillById(id);

    if (data.instruksiSoal !== undefined && data.instruksiSoal.length < 100) {
      throw new AppError('Instruksi soal minimal 100 karakter', 400, 'VALIDATION_ERROR');
    }

    return prisma.aISkill.update({
      where: { id },
      data: {
        namaSkill: data.namaSkill ?? skill.namaSkill,
        subtes: data.subtes ?? skill.subtes,
        topikCakupanJson: (data.topikCakupanJson ?? skill.topikCakupanJson) as any,
        instruksiSoal: data.instruksiSoal ?? skill.instruksiSoal,
        contohSoalJson: (data.contohSoalJson ?? skill.contohSoalJson) as any,
        larangan: data.larangan ?? skill.larangan,
        versi: data.versi ?? skill.versi,
      },
    });
  }

  async deleteSkill(id: string): Promise<AISkill> {
    await this.getSkillById(id);
    return prisma.aISkill.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
