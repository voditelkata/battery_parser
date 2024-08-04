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
      titles.push('link');

      const rowsElements = document.querySelectorAll('tbody > tr');
      const rows =  [...rowsElements].map(rowElement => {
        const cells = Array.from(rowElement.children);
        const  result = cells.map((cell) => {
          return cell.innerText.trim();
        });
        const link = cells.at(0).querySelector('a');
        result.push(link?.href);

        return result;
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

  async getProductDetails() {
    return await this.page.evaluate(() => {
      const name = document.querySelector('h1')?.innerText?.trim();
      const productCodeTitle =  Array.from(document.querySelectorAll('table tr strong'))?.find(el => el.innerText === 'Артикул');
      const productCode = productCodeTitle?.parentNode?.parentElement?.nextElementSibling?.textContent;
      return {
        name,
        productCode,
      }
    });
  }

  async parseProducts(items) {
    const products = [];
    for await (const item of items) {
      await this.page.goto(item.link, { waitUntil: 'domcontentloaded' });
      const product = await this.getProductDetails();
      products.push(product);
    }
    return products
  }

  mapperProductWithDetailInfo(products, productsWithDetail) {
    return products.map(({link, ...product}, index) => ({
      ...product,
      'Артикул': productsWithDetail[index].productCode,
    }));
  }

  async parse() {
    const result = [];
    for await (const brand of this.brands) {
      const productsByBrand = await this.getDataByBrand(brand);
      const productsDetailInfo = await this.parseProducts(productsByBrand);
      const products = this.mapperProductWithDetailInfo(productsByBrand, productsDetailInfo);
      result.push(...products);
    }
    return result;
  }
}
