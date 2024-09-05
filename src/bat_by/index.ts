import { brands, fileName, password, url, username } from './constants.js';
import { FileSaver } from '../common/FileSaver.js';
import { BatByParser } from './BatByParser.js';
import { PuppeteerBrowser } from '../common/Browser.js';

const browser = new PuppeteerBrowser();

try {
  await browser.init();
  const page = await browser.getPageInstance();
  const brandParser = new BatByParser(page);

  await brandParser.login({ url, username, password });
  const result = await brandParser.parse(brands);

  FileSaver.createFile(fileName, result);

  await browser.close();
} catch (error) {
  console.error('Something happens:', error);
}
