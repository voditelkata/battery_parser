import { brands, fileName, password, url_to_sign_in, url_to_parse, username } from './constants.js';
import { FileSaver } from '../common/FileSaver.js';
import { AkParser } from './AkParser.js';
import { PuppeteerBrowser } from '../common/Browser.js';

const browser = new PuppeteerBrowser();

try {
  await browser.init();
  const page = await browser.getPageInstance();
  const brandParser = new AkParser(page);

  await brandParser.login({ url: url_to_sign_in, username, password });
  const result = await brandParser.parse(url_to_parse, brands);
  FileSaver.createFile(fileName, result);
  await browser.close();
} catch (error) {
  console.error('Something happens:', error);
}
