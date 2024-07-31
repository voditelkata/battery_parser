import { PageParser } from './PageParser.js';
import { FileSaver } from './FileSaver.js';
import {BrandParser} from "./BrandParser.js";

const url = 'https://bat.by/optovye-pokupateli';

const username = '192748524';
const password = '192748524EYG2016';

const brands = [
  'akom',
  'varta',
  'АКТЕХ',
  'WESTA',
  'blt',
  'camel',
  'Start.Bat',
  'delta',
  'kainar',
  'курский',
  'kijo',
  'sparta',
  'зарядные',
  'аксессуары',
];

const fileName = 'price_Bat.xlsx';

const brandParser = new BrandParser(url, username, password, brands);

try {
  await brandParser.init();
  await brandParser.login();
  const result = await brandParser.parse();

  FileSaver.createFile(fileName, result);

  await brandParser.close()
} catch (error) {
  console.error('Something happens:', error);
}
