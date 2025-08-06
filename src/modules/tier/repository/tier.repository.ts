import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  TierlistData,
} from '../interfaces/tier.interface';
import { UpdateTierDto } from '../dto/request/update-tier.dto';

@Injectable()
export class TierRepository {
  private readonly tierlistPath = path.join(
    process.cwd(),
    'static',
    'tierlist.ts',
  );

  private readTierlistFile(): TierlistData {
    try {
      const fileContent = fs.readFileSync(this.tierlistPath, 'utf-8');
      const tierlistMatch = fileContent.match(
        /export const tierlist = ({[\s\S]*});/,
      );
      if (!tierlistMatch) {
        throw new Error('Invalid tierlist file format');
      }
      return eval(`(${tierlistMatch[1]})`);
    } catch (error) {
      throw new Error(`Failed to read tierlist file: ${error.message}`);
    }
  }

  private writeTierlistFile(data: TierlistData): void {
    try {
      const fileContent = `export const tierlist = ${JSON.stringify(data, null, 2)};`;
      fs.writeFileSync(this.tierlistPath, fileContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write tierlist file: ${error.message}`);
    }
  }

  async findAll(): Promise<TierlistData> {
    return this.readTierlistFile();
  }

  async updatePart(partData: UpdateTierDto): Promise<void> {
    const tierlist = this.readTierlistFile();
    const partIndex = tierlist.data.findIndex(
      (part) => part.partInfo.partIdx === partData.partInfo.partIdx,
    );

    if (partIndex === -1) return null;

    tierlist.data[partIndex] = partData;
    this.writeTierlistFile(tierlist);
  }

  async insertPart(partData: UpdateTierDto): Promise<void> {
    const tierlist = this.readTierlistFile();
    tierlist.data.push(partData);
    this.writeTierlistFile(tierlist);
  }
}
