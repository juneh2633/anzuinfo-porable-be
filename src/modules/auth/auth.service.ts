import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SignInDto } from './dto/request/auth.dto';
import { compareSync, hashSync } from 'bcrypt';
import { SignUpDto } from './dto/request/sign-up.dto';
import { User } from './model/user.model';
import { IdDuplicateException } from './exception/IdDuplicate.exception';
import { AccountRepository } from '../account/repository/account.repository';
import { SVDuplicateException } from './exception/SVDuplicate.exception';
import { AccountWriteRepository } from './repository/account-write.repository';
import { GetSdvxIdDto } from './dto/request/get-sdvx-id.dto';
import { GetPwDto } from './dto/request/get-pw.dto';
import { LoginFailException } from './exception/LoginFail.exception';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly accountRepository: AccountRepository,
    private readonly accountWriteRepository: AccountWriteRepository,
  ) {}

  async signIn(signInDto: SignInDto): Promise<string> {
    const account = await this.prisma.account.findFirst({
      where: { id: signInDto.id, deletedAt: null },
    });

    if (!account || !account.pw) {
      throw new LoginFailException();
    }
    const passwordMatch = compareSync(signInDto.pw, account.pw);

    if (!passwordMatch) {
      throw new LoginFailException();
    }

    return await this.jwtService.signAsync({
      idx: account.idx,
      id: account.id,
      vf: account.vf,
      rankIdx: account.rankIdx,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  }

  async signUp(signUpDto: SignUpDto): Promise<void> {
    const [accountCheck, sdvxIdCheck] = await Promise.all([
      this.accountRepository.selectAccountById(signUpDto.id),
      this.accountRepository.selectAccountBySdvxId(signUpDto.sdvxId),
    ]);

    if (accountCheck) {
      throw new IdDuplicateException();
    }
    if (sdvxIdCheck) {
      throw new SVDuplicateException();
    }

    await this.accountWriteRepository.createAccount(
      signUpDto.id,
      hashSync(signUpDto.pw, 1),
      signUpDto.sdvxId,
    );
  }

  async amendSV(getSdvxIdDto: GetSdvxIdDto, user: User): Promise<void> {
    await this.accountWriteRepository.updateAccountSV(
      user.idx,
      getSdvxIdDto.sdvxId,
    );
  }

  async amendPW(getPwDto: GetPwDto, user: User): Promise<void> {
    await this.accountWriteRepository.updateAccountPW(
      user.idx,
      hashSync(getPwDto.pw),
    );
  }

  async withdraw(user: User) {
    await this.accountWriteRepository.softDeleteAccount(user.idx);
  }
}
