import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  constructor() {}
  getScoreCoefficient(score: number): number {
    let scoreRank = 1;
    if (score >= 9900000) {
      //s
      scoreRank = 1.05;
    } else if (score >= 9800000) {
      //AAA+
      scoreRank = 1.02;
    } else if (score >= 9700000) {
      //AAA
      scoreRank = 1;
    } else if (score >= 9500000) {
      //AA+
      scoreRank = 0.97;
    } else if (score >= 9300000) {
      //AA
      scoreRank = 0.94;
    } else if (score >= 9000000) {
      //A+
      scoreRank = 0.91;
    } else if (score >= 8700000) {
      //A
      scoreRank = 0.88;
    } else if (score >= 7500000) {
      //B
      scoreRank = 0.85;
    } else if (score >= 6500000) {
      //C
      scoreRank = 0.82;
    } else {
      //D
      scoreRank = 0.8;
    }
    return scoreRank;
  }
  getClearCoefficient(rank: number): number {
    let clearRank = 1;
    if (rank === 0) {
      clearRank = 1.1;
    } else if (rank === 1) {
      clearRank = 1.05;
    } else if (rank === 2) {
      clearRank = 1.02;
    } else if (rank === 3) {
      clearRank = 1;
    } else if (rank === 4) {
      clearRank = 0.5;
    } else if (rank === 5) {
      clearRank = 1.04;
    }

    return clearRank;
  }
  getRankIdx(rank: string): number {
    if (rank === 'per') {
      return 0;
    } else if (rank === 'uc') {
      return 1;
    } else if (rank === 'comp_ex') {
      return 2;
    } else if (rank === 'comp') {
      return 3;
    } else if (rank === 'comp_max') {
      return 5;
    } else {
      return 4;
    }
  }
  getRank(rankIdx: number): string {
    if (rankIdx === 0) {
      return 'per';
    } else if (rankIdx === 1) {
      return 'uc';
    } else if (rankIdx === 2) {
      return 'comp_ex';
    } else if (rankIdx === 3) {
      return 'comp';
    } else if (rankIdx === 5) {
      return 'comp_max';
    } else {
      return 'play';
    }
  }

  getVolforce(level: number, score: number, rank: number): number {
    //볼포스=레벨×2×(점수/10,000,000)×클리어 마크 보정×랭크 보정(소수 둘째 자리에서 버림)
    let scoreCoefficient = this.getScoreCoefficient(score);
    let clearCoefficient = this.getClearCoefficient(rank);

    const volforce =
      level * 2 * (score / 10000000) * scoreCoefficient * clearCoefficient;

    return (Math.floor(volforce * 100) / 100) * 10;
  }
}
