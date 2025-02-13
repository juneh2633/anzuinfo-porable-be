import { Prisma } from '@prisma/client';

export type PlaydataVfRaw = Prisma.PlaydataGetPayload<{
  select: {
    chart: {
      select: {
        song: {
          select: {
            title: true;
          };
        };
        level: true;
        jacket: true;
        type: true;
      };
    };
    rank: true;
    score: true;
    chartVf: true;
  };
}>;
