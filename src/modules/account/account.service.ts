import { Injectable } from '@nestjs/common';
import { GetSdvxIdDto } from './dto/request/get-sdvx-id.dto';
import { AccountRepository } from './repository/account.repository';
import { NoUserException } from './exception/no-user.exception';
import { AccountPickEntity } from './entity/AccountPick.entity';

@Injectable()
export class AccountService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async findUserBySdvxId(getSdvxIdDto: GetSdvxIdDto): Promise<void> {
    const account = await this.accountRepository.selectAccountBySdvxId(
      getSdvxIdDto.sdvxId,
    );
    if (account === null) {
      throw new NoUserException();
    }
  }
  async findUser(accountIdx: number): Promise<AccountPickEntity> {
    const account = await this.accountRepository.selectAccountByIdx(accountIdx);
    return AccountPickEntity.createDto(account);
  }

  async findUserUpateAt(accountIdx: number): Promise<Date> {
    const account = await this.accountRepository.selectAccountByIdx(accountIdx);
    return account.updatedAt;
  }

  async changeHidden(accountIdx: number): Promise<void> {
    const account = await this.accountRepository.selectAccountByIdx(accountIdx);
    await this.accountRepository.updateHidden(
      accountIdx,
      (account.isHidden + 1) % 2,
    );
  }
}
