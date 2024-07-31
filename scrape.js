const puppeteer = require('puppeteer');
const XLSX = require('xlsx');
let resultData = [];

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    // page.setDefaultNavigationTimeout(0);
    await page.goto('https://bat.by/optovye-pokupateli', { waitUntil: 'domcontentloaded' });
    await page.click('#modlgn-username');
    await page.waitForTimeout(500);
    await page.type('#modlgn-username', '192748524', { delay: 100 });
    await page.click('#modlgn-passwd');
    await page.waitForTimeout(500);
    await page.type('#modlgn-passwd', '192748524EYG2016', { delay: 100 });
    await page.click('input[type="submit"]');
    await page.waitForNavigation();

    async function getBrandTable(brand) {
        await page.click('input[class="form-control search"]');
        await page.type('input[class="form-control search"]', brand, { delay: 200 });
        await page.keyboard.press('Enter')
        await page.waitForNavigation();
        await page.type('#limit', '150', { delay: 100 });
        await page.waitForNavigation();

        const quotes = await page.evaluate(() => {
            const titleElements = document.querySelectorAll('thead > tr > th');
            const titles = [...titleElements].map(element => element.textContent.replace(/[-]/gm, '').replace('цена', ' цена'));

            const rowsElements = document.querySelectorAll('tbody > tr');
            const rows = [...rowsElements].map(rowElement => {
                const cells = rowElement.children;
                const cellsData = [...cells].map(cell => {
                    const text = cell.textContent;
                    return text.replace(/[\r\n]/gm, '').trim();
                });
                return cellsData
            });

            const result = rows.map(row => {
                return row.reduce((previousValue, currentValue, currentIndex) => ({
                    ...previousValue,
                    [titles[currentIndex]]: currentValue
                }), [])
            });
            return result;
        });
        resultData = [...resultData, ...quotes];
    }

    await getBrandTable('akom');
    await getBrandTable('varta');
    await getBrandTable('АКТЕХ');
    await getBrandTable('WESTA');
    await getBrandTable('blt');
    await getBrandTable('camel');
    await getBrandTable('Start.Bat');
    await getBrandTable('delta');
    await getBrandTable('kainar');
    await getBrandTable('курский');
    await getBrandTable('kijo');
    await getBrandTable('sparta');
    await getBrandTable('зарядные');
    await getBrandTable('аксессуары');

    const currentDate = new Date();
    const workSheet = XLSX.utils.json_to_sheet(resultData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet 1");
    XLSX.writeFile(workBook, `./${currentDate.getDate()}_${currentDate.getMonth() + 1}_price_Bat.xlsx`);


})();