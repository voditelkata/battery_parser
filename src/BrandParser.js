import {PageParser} from "./PageParser.js";

export class BrandParser extends PageParser {
  constructor(url, username, password, brands) {
    super();
    this.url = url;
    this.username = username;
    this.password = password;
    this.brands = brands;
  }

  async login() {
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await this.page.click('#modlgn-username');
    await this.page.type('#modlgn-username', this.username, { delay: 100 });
    await this.page.click('#modlgn-passwd');
    await this.page.type('#modlgn-passwd', this.password, { delay: 100 });
    await this.page.click('input[type="submit"]');
    await this.page.waitForNavigation();
  }

  async getDataByBrand(brand) {
    await this.page.click('input[class="form-control search"]');
    await this.page.type('input[class="form-control search"]', brand, { delay: 200 });
    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation();
    await this.page.type('#limit', '150', { delay: 100 });
    await this.page.waitForNavigation();

    return await this.page.evaluate(() => {
      const titleElements = document.querySelectorAll('thead > tr > th');
      const titles = [...titleElements].map(element =>
        element.textContent.replace(/[-]/gm, '').replace('цена', ' цена'),
      );

      const rowsElements = document.querySelectorAll('tbody > tr');
      const rows = [...rowsElements].map(rowElement => {
        const cells = rowElement.children;
        return [...cells].map(cell => {
          const text = cell.textContent;
          return text.replace(/[\r\n]/gm, '').trim();
        });
      });

      return rows.map(row => {
        return row.reduce(
          (previousValue, currentValue, currentIndex) => ({
            ...previousValue,
            [titles[currentIndex]]: currentValue,
          }),
          [],
        );
      });
    });
  }

  async parse() {
    const result = [];
    for await (const brand of this.brands) {
      const dataByBrand = await this.getDataByBrand(brand);
      result.push(...dataByBrand);
    }
    return result;
  }
}
