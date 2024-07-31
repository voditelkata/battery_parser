import puppeteer from 'puppeteer';

export class PageParser {
  async init() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  async close() {
    await this.browser.close()
  }

}
