import puppeteer, { Browser, Page } from 'puppeteer';

export class PuppeteerBrowser {
  private browser: Browser | undefined;

  async init() {
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [`--window-size=1920,1080`],
    });
  }

  async getPageInstance(): Promise<Page> {
    if (this.browser) {
      const page = await this.browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.resourceType() === 'image') {
          request.abort();
        } else {
          request.continue();
        }
      });
      return page;
    }

    throw new Error('No browser found.');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
