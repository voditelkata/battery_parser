import * as XLSX from 'xlsx';

export class FileSaver {
  static createFile(fileName: string, data: Array<any>) {
    const currentDate = new Date();
    const workSheet = XLSX.utils.json_to_sheet(data);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');
    XLSX.writeFile(workBook, `./${currentDate.getDate()}_${currentDate.getMonth() + 1}_${fileName}`);
  }
}
