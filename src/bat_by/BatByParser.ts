import { Page } from 'puppeteer';
import { Product, ProductDetails, ProductWithLink } from './types.js';
import { LoginProps } from '../common/types.js';

export class BatByParser {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login({ url, username, password }: LoginProps): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.click('#modlgn-username');
    await this.page.type('#modlgn-username', username, { delay: 100 });
    await this.page.click('#modlgn-passwd');
    await this.page.type('#modlgn-passwd', password, { delay: 100 });
    await this.page.click('input[type="submit"]');
    await this.page.waitForNavigation();
  }

  private async getDataByBrand(brand: string): Promise<Array<ProductWithLink> | undefined> {
    await this.page.click('input[class="form-control search"]');
    await this.page.type('input[class="form-control search"]', brand, { delay: 200 });
    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation();
    await this.page.type('#limit', '150', { delay: 100 });
    await this.page.waitForNavigation();

    return await this.page.evaluate((): ProductWithLink[] | undefined => {
      const titleElements = document.querySelectorAll<HTMLElement>('thead > tr > th');
      const titles: string[] = [...titleElements].map(
        (element: HTMLElement): string => element?.textContent?.replace(/[-]/gm, '')?.replace('цена', ' цена') || '',
      );
      titles.push('link');

      const rowsElements = document.querySelectorAll<HTMLElement>('tbody > tr');
      const rows: string[][] = [...rowsElements]?.map((rowElement: HTMLElement): string[] => {
        const cells: Element[] = Array.from(rowElement.children);
        const result: string[] = cells.map(cell => cell?.textContent?.trim() || '');
        result.push(cells.at(0)?.querySelector('a')?.href || '');

        return result;
      });

      return rows?.map(row =>
        row.reduce(
          (previousValue, currentValue, currentIndex) => ({
            ...previousValue,
            [titles[currentIndex] as string]: currentValue,
          }),
          [],
        ),
      ) as unknown as ProductWithLink[];
    });
  }

  private async getProductDetails(): Promise<ProductDetails> {
    return await this.page.evaluate((): ProductDetails => {
      const name = document.querySelector('h1')?.innerText?.trim();
      const productCodeTitle = Array.from(document.querySelectorAll<HTMLElement>('table tr strong'))?.find(
        el => el.innerText === 'Артикул',
      );
      const productCode = productCodeTitle?.parentNode?.parentElement?.nextElementSibling?.textContent;
      return {
        name: name || '',
        productCode: productCode || '',
      };
    });
  }

  private async parseProducts(items: ProductWithLink[]): Promise<ProductDetails[]> {
    const products = [];
    for await (const item of items) {
      await this.page.goto(item.link, { waitUntil: 'domcontentloaded' });
      const product = await this.getProductDetails();
      products.push(product);
    }
    return products;
  }

  private mapperProductWithDetailInfo(products: ProductWithLink[], productsWithDetail: ProductDetails[]): Product[] {
    return products.map(({ link, ...product }, index) => ({
      ...product,
      '#': '',
      'Артикул': productsWithDetail[index].productCode,
    }));
  }

  async parse(brands: Array<string>): Promise<Product[]> {
    const result: Product[] | PromiseLike<Product[]> = [];
    for await (const brand of brands) {
      const productsByBrand = await this.getDataByBrand(brand);
      if (productsByBrand) {
        const productsDetailInfo = await this.parseProducts(productsByBrand);
        const products = this.mapperProductWithDetailInfo(productsByBrand, productsDetailInfo);
        result.push(...products);
      }
    }
    return result;
  }
}
