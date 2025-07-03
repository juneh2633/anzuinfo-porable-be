import { Controller, Post } from '@nestjs/common';
import { ChartService } from './chart.service';
import { ChartAdminService } from './chart-admin.service';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';

@Controller('admin')
export class ChartAdminController {
  constructor(private readonly chartAdminService: ChartAdminService) {}

  @Post('/jacket/all')
  async jacketUploadAll() {
    await this.chartAdminService.uploadJacketAll();
    return new SuccessResponseDto();
  }
}
