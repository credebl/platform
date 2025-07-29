export enum LogLevel {
  Emergency = 'emergency', // One or more systems are unusable.
  Fatal = 'fatal', // A person must take an action immediately
  Error = 'error', // Error events are likely to cause problems
  Warn = 'warn', // Warning events might cause problems in the future and deserve eyes
  Info = 'info', // Routine information, such as ongoing status or performance
  Debug = 'debug' // Debug or trace information
}
