import { Injectable } from '@nestjs/common';
import { Account, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AccountRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async selectAccountByIdx(idx: number): Promise<Account | null> {
    const account = await this.prismaService.account.findFirst({
      where: {
        idx: idx,
        deletedAt: null,
      },
    });
    return account;
  }
  async selectAccountById(id: string): Promise<Account | null> {
    const account = await this.prismaService.account.findFirst({
      where: {
        id: id,
        deletedAt: null,
      },
    });
    return account;
  }

  async selectAccountBySdvxId(sdvxId: string): Promise<Account | null> {
    const account = await this.prismaService.account.findFirst({
      where: {
        sdvxId: sdvxId,
        deletedAt: null,
      },
    });
    return account;
  }

  async updateAccountPlaydata(
    userIdx: number,
    playerName: string,
    playCount: number,
    vf: number,
    skillLevel: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prismaService.account.update({
      where: {
        idx: userIdx,
      },
      data: {
        playCount: playCount,
        playerName: playerName,
        vf: vf,
        skillLevel: skillLevel,
        updatedAt: updatedAt,
      },
    });
  }

  async updateHidden(userIdx: number, isHidden: number): Promise<void> {
    await this.prismaService.account.update({
      where: {
        idx: userIdx,
      },
      data: {
        isHidden: isHidden,
      },
    });
  }
}
