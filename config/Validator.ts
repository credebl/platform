import validator from 'validator';

interface ValidationResponse {
  message: string;
  success: boolean;
  received: string;
}

// interface Params {
//   message?: string
// }

export class Validator {
  protocol = (protocol: string): ValidationResponse => {
    const success = ['http', 'https'].includes(protocol);

    return {
      message: `Invalid protocol. Must be 'http' or 'https'.`,
      success,
      received: protocol
    };
  };

  port = (port: string): ValidationResponse => {
    const portNumber = Number(port);
    const success = validator.isNumeric(port) && 1024 < portNumber && 65536 > portNumber;

    return {
      message: 'Invalid port. Must be a number between 1024 and 65536.',
      success,
      received: port
    };
  };
  // port = (value: string, { message } : Params): ValidationResponse => {
  //   const portNumber = Number(value);
  //   const success = validator.isNumeric(value) && 1024 < portNumber && 65536 > portNumber;

  //   return {
  //     message: message || 'Invalid port. Must be a number between 1024 and 65536.',
  //     received: value,
  //     success
  //   };
  // };

  host = (host: string): ValidationResponse => {
    const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;

    const success = validator.isIP(host) || domainRegex.test(host) || 'localhost' === host;

    return {
      message: 'Invalid host. Check the IP address.',
      received: host,
      success
    };
  };

  endpoint = (endpoint: string): ValidationResponse => {
    const [host, port] = endpoint.split(':');

    const { message: hostMessage, success: hostSuccess } = this.host(host);
    const { message: portMessage, success: portSuccess } = this.port(port);

    return {
      message: `Invalid endpoint: ${hostSuccess ? '' : hostMessage} ${portSuccess ? '' : portMessage}`,
      received: endpoint,
      success: hostSuccess && portSuccess
    };
  };

  url = (url: string): ValidationResponse => ({
    message: `Invalid URL.`,
    received: url,
    success: validator.isURL(url) || url.startsWith('http:/localhost') // FIXME:
  });

  number = (numberString: string): ValidationResponse => ({
    message: `Invalid number.`,
    received: numberString,
    success: validator.isNumeric(numberString)
  });

  notEmpty = (val: string): ValidationResponse => ({
    // stub method, filler
    message: ``,
    received: val,
    success: true
  });

  email = (email: string): ValidationResponse => {
    const success = validator.isEmail(email);

    return {
      message: `Invalid email. Must be in the form example@example.com`,
      received: email,
      success
    };
  };
}
