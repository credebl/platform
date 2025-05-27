import DailyRotateFile = require('winston-daily-rotate-file')

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class FileTransport {
  public static create() {
    return new DailyRotateFile({
      dirname: 'logs',
      filename: 'log-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    })
  }
}
