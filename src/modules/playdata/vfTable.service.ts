import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PlaydataVfRawEntity } from './entity/PlaydataVfRaw.entity';
import { getScoreRank } from 'src/common/util/getScoreRank';
import { getClearRank } from 'src/common/util/getClearRank';
@Injectable()
export class VfTableService {
  constructor() {}

  async generateGameImage(data: PlaydataVfRawEntity[]): Promise<any> {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'static',
      'tableTemplete.html',
    );
    const templateHtml = await fs.readFile(templatePath, 'utf-8');

    // Handlebars 템플릿 엔진 사용
    const template = handlebars.compile(templateHtml);

    // 10행 5열로 나누기
    const rows = [];
    for (let i = 0; i < data.length; i += 5) {
      rows.push(data.slice(i, i + 5));
    }

    // finalHtml에서 data를 10행 5열로 전달
    const finalHtml = template({
      rows: rows.map((row) =>
        row.map((item) => ({
          jacket: item.jacket,
          level: item.level,
          clearRank: getClearRank(item.clearRankIdx),
          grade: getScoreRank(item.score),
          title: item.title,
          score: item.score,
          chartVf: item.chartVf,
        })),
      ),
    });

    // Puppeteer 실행
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(finalHtml);

    const outputDir = path.join(process.cwd(), 'static');
    const outputPath = path.join(outputDir, `game-image-${Date.now()}.png`);
    const outputHtmlPath = path.join(
      outputDir,
      `game-image-${Date.now()}.html`,
    );
    // 디렉토리가 없으면 생성
    await fs.promises.mkdir(outputDir, { recursive: true });

    await page.setViewport({ width: 1800, height: 1600 }); // Adjust these values as needed
    await page.screenshot({ path: outputPath, type: 'png' });

    await fs.writeFile(outputHtmlPath, finalHtml);

    await browser.close();
    return 1; // 이미지 경로 반환
  }
}
