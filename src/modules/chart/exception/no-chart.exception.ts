import { HttpException } from '@nestjs/common';
import { ErrorCodes } from 'src/common/lib/error-code';

export class NoChartException extends HttpException {
  constructor() {
    super('no chart', ErrorCodes.NO_CHART);
  }
}
