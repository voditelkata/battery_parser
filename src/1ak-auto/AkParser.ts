import { Page } from 'puppeteer';
import { LoginProps } from '../common/types.js';
import { url_to_parse } from './constants.js';
import { Product, ProductToPreview } from './types.js';
import { ProductDetails, ProductWithLink } from '../bat_by/types.js';
import { NotFoundError } from '../errors/NotFoundError.js';

export class AkParser {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login({ url, username, password }: LoginProps): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.click('#form_email');
    await this.page.type('#form_email', username, { delay: 100 });
    await this.page.click('#form_pass');
    await this.page.type('#form_pass', password, { delay: 100 });
    await this.page.click('a.is-submit');
    await this.page.waitForNavigation();
  }

  private async clickShowMoreBtn() {
    const btn = await this.page.evaluate((): HTMLSpanElement => {
      return <HTMLSpanElement>document.querySelector('div.ajax-next-page > span.get-next-positions');
    });
    if (btn) {
      await this.page.click('div.ajax-next-page > span.get-next-positions', { delay: 1500 });
      await this.page.waitForResponse(response => response.url().includes(url_to_parse) && response.status() === 200);
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.clickShowMoreBtn();
    }
  }

  private async getProductLinksByBrand(brand: string): Promise<string[] | undefined> {
    await this.page.click('input[class="fsearch-complete"]');
    await this.page.type('input[class="fsearch-complete"]', brand, { delay: 200 });
    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation();

    const selectValue = await this.page.evaluate((): string | undefined => {
      const maxValue = '96';

      const element = document.querySelector<HTMLSelectElement>('.cat-sorting > div:last-of-type > select');
      if (element) {
        element.style.display = 'block';
        const options = Array.from(element.options);
        const optionToSelect = options.find(item => item.text === maxValue);
        return optionToSelect?.value;
      }
    });

    if (selectValue) {
      await this.page.select('.cat-sorting > div:last-of-type > select', selectValue);
    }

    await this.page.waitForResponse(response => response.url().includes(url_to_parse) && response.status() === 200);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.clickShowMoreBtn();

    return await this.page.evaluate((): string[] | undefined => {
      const products = document.querySelectorAll('.item-product');
      if (products) {
        return Array.from(products)?.map((el): string => {
          const linkElement = el.querySelector<HTMLLinkElement>('div.item-product-shop-name > a');
          return linkElement?.href || '';
        });
      }
    });
  }

  private async getProductDetails(): Promise<Product> {
    const data = await this.page.evaluate((): Product => {
      const name = document.querySelector<HTMLHeadingElement>('.main > h1')?.innerText?.trim();
      const brand = document.querySelector<HTMLDivElement>('.brand-name')?.textContent?.split(':')?.at(-1)?.trim();
      const itemNumber = document
        .querySelector<HTMLDivElement>('.article-name')
        ?.textContent?.split(':')
        ?.at(-1)
        ?.trim();
      const price = document.querySelector<HTMLSpanElement>('.line-price .h1')?.innerText?.trim();
      const quantity = document
        .querySelector<HTMLSpanElement>('.g-imp-line-info .fa-dropbox')
        ?.nextSibling?.textContent?.split(':')
        ?.at(-1)
        ?.trim();
      const delivery = document
        .querySelector<HTMLSpanElement>('.g-imp-line-info .fa-truck')
        ?.nextSibling?.textContent?.split(':')
        ?.at(-1)
        ?.trim();
      const noOffer = document.querySelector<HTMLSpanElement>('.no-offer')?.textContent?.trim();

      return {
        name,
        brand,
        delivery: delivery || noOffer,
        itemNumber,
        price,
        quantity,
      };
    });

    if (data.name === 'ОШИБКА 404') {
      throw new NotFoundError('not found');
    }

    return data;
  }

  private async parseProducts(urls: string[]): Promise<Product[]> {
    const products = [];
    for await (const url of urls) {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      try {
        const product = await this.getProductDetails();
        products.push(product);
      } catch (e) {
        if (e instanceof NotFoundError) {
          console.log('Not found', url);
        } else {
          throw e;
        }
      }
    }
    return products;
  }

  private mapperProductWithDetailInfo(products: Product[]): ProductToPreview[] {
    return products.map(product => ({
      Бренд: product.brand || '',
      Наименование: product.name || '',
      Артикул: product.itemNumber || '',
      Цена: product.price || '',
      Остаток: product.quantity || '',
      Поставка: product.delivery || '',
    }));
  }

  async parse(url: string, brands: Array<string>): Promise<any[]> {
    const result: any[] | PromiseLike<any[]> = [];
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    for await (const brand of brands) {
      const productLinks = await this.getProductLinksByBrand(brand);
      if (productLinks) {
        const productsDetailInfo = await this.parseProducts(productLinks);
        const products = this.mapperProductWithDetailInfo(productsDetailInfo);
        result.push(...products);
      }
    }
    return result;
  }
}
