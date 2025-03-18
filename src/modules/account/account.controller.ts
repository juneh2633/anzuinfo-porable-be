import { Body, Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { AccountService } from './account.service';
import { GetSdvxIdDto } from './dto/request/get-sdvx-id.dto';
import { SuccessResponseDto } from 'src/common/dto/Success-response.dto';
import { AuthCheck } from 'src/common/decorator/auth-check.decorator';
import { ExceptionList } from 'src/common/decorator/exception-list.decorator';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { User } from '../auth/model/user.model';
import { AccountResponseDto } from './dto/response/account.response.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * sv 존재여부 확인
   */
  @Post('/check')
  async checkUser(
    @Body() getSdvxIdDto: GetSdvxIdDto,
  ): Promise<SuccessResponseDto> {
    await this.accountService.findUserBySdvxId(getSdvxIdDto);
    return new SuccessResponseDto();
  }

  /**
   * 내 정보
   */
  @Get('/')
  @AuthCheck(1)
  async getAccount(@GetUser() user: User): Promise<AccountResponseDto> {
    const account = await this.accountService.findUser(user.idx);
    return AccountResponseDto.createResponse(account);
  }

  /**
   * 유저 히든 변경
   */
  @Patch('/hidden')
  @AuthCheck(1)
  async changeHidden(@GetUser() user: User): Promise<SuccessResponseDto> {
    await this.accountService.changeHidden(user.idx);
    return new SuccessResponseDto();
  }
}
