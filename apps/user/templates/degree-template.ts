import { Attribute } from '../interfaces/user.interface';

export class DegreeCertificateTemplate {
    findAttributeByName(attributes: Attribute[], name: string): Attribute {
      return attributes.find((attr) => name in attr);
    }

    async getDegreeCertificateTemplate(attributes: Attribute[]): Promise<string> {
      try {
        // const [fullName, degree, major, graduationDate] = await Promise.all(attributes).then((attributes) => {
          const fullName = this.findAttributeByName(attributes, 'Student Name')?.full_name ?? '';
        //   const degree = this.findAttributeByName(attributes, 'degree')?.degree ?? '';
        //   const major = this.findAttributeByName(attributes, 'major')?.major ?? '';
        //   const graduationDate = this.findAttributeByName(attributes, 'graduation_date')?.graduation_date ?? '';
        //   return [fullName, degree, major, graduationDate];
        // });
//   console.log('attributes::', attributes);
        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
        
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                <link
                    href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap"
                    rel="stylesheet"
                />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
                <style>
                    table,
                    th {
                        border: 1px solid black;
                        border-collapse: collapse;
                        padding: 1rem;
                        vertical-align: top;
                    }
                    td {
                        border-left: 1px solid black;
                        border-right: 1px solid black;
                        padding: 1rem;
                    }
                    tr:last-child {
                        border-bottom: 1px solid black;
                    }
                    h1 {
                        color: #d15b1e;
                        font-family: 'MedievalSharp', cursive;
                    }
                    body {
                        font-family: 'Inter', sans-serif;
                    }
                </style>
            </head>
            <body>
                <div style="line-height: 1.5; margin: auto;">
                    <div style="position: relative;">
                        <div style="">
                            <img style="width: 1260px" src="https://credebl-dev-user-certificate.s3.ap-south-1.amazonaws.com/certificates/uni-frame.svg" />
                        </div>
                    </div>
                    <div style="position: absolute;top: 0px;width: 1260px;padding: 5rem;padding-left: 5rem;padding-right: 5rem;">
                        <div style="display: flex; justify-content: center;">
                            <div>
                                <img
                                    style="width: 200px; height: auto; margin-top: 1rem;"
                                    src="https://credebl-dev-user-certificate.s3.ap-south-1.amazonaws.com/certificates/college-color-logo.svg"
                                />
                            </div>
                            <div
                                style="position: absolute; top: 5rem; right: 5rem; font-size: 2rem;"
                            >
                                SL.No : 50401041
                            </div>
                        </div>
                        <div
                            style="text-align: center; display: flex; flex-direction: column; align-items: center;"
                        >
                            <h1 style="font-size: 3em;">College Campus</h1>
                            <h3 style="font-size: 1.2em; color: rgb(5, 148, 170);">Vishnupuri, Nanded, India, 410206</h3>
                            <div
                                style="padding: 1rem 4rem; margin: 0.5rem 0; background-color: #f7f0e8; width: fit-content;"
                            >
                                <h1 style="font-size: 3em;">Grade Card</h1>
                                <p style="font-size: 1.2rem;">(Academic Year 2018-19)</p>
                                <div id="qr-code"></div>
                            </div>
                        </div>
                        <div>
                            <div style="text-align: start; font-size: 1.5rem; line-height: 2;">
                                <h5>Name of the Student : Abhinav Mishra ${fullName}</h5>
                                <h5>Programme : M .Tech ( Computer Engineering )</h5>
                                <div style="display: flex; justify-content: space-between;">
                                    <div>Year : 2022</div>
                                    <div>Semester : I ( Regular )</div>
                                    <div>Registration Number : 2018MNS017</div>
                                </div>
                            </div>
                            <div style="margin-top: 1rem;">
                                <table border="1" style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th rowspan="2">Course Code</th>
                                            <th rowspan="2">Course</th>
                                            <th colspan="2">Theory</th>
                                            <th colspan="2">Practical</th>
                                        </tr>
                                        <tr>
                                            <th>Grade Credits</th>
                                            <th>GradeCredits</th>
                                            <th>Obtained Earned</th>
                                            <th>Obtained Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>MCC-590</td>
                                            <td>Research Methodology</td>
                                            <td>S</td>
                                            <td>2</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>MAC-591</td>
                                            <td>English for Research Paper Writing</td>
                                            <td>A+</td>
                                            <td>23</td>
                                            <td>12</td>
                                            <td>68</td>
                                        </tr>
                                        <tr>
                                            <td>MCC-590</td>
                                            <td>Research Methodology</td>
                                            <td>S</td>
                                            <td>2</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>MAC-591</td>
                                            <td>English for Research Paper Writing</td>
                                            <td>A+</td>
                                            <td>23</td>
                                            <td>12</td>
                                            <td>68</td>
                                        </tr>
                                        <tr>
                                            <td>MCC-590</td>
                                            <td>Research Methodology</td>
                                            <td>S</td>
                                            <td>2</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>MAC-591</td>
                                            <td
                                                >Elective: Information System Security for Professionals -
                                                Part I</td
                                            >
                                            <td>A+</td>
                                            <td>23</td>
                                            <td>12</td>
                                            <td>68</td>
                                        </tr>
                                        <tr>
                                            <td>MCC-590</td>
                                            <td>Research Methodology</td>
                                            <td>S</td>
                                            <td>2</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table border="1" style="width: 100%; margin-top: 1rem;">
                                    <thead>
                                        <tr>
                                            <th colspan="2">Current Semester Performance</th>
                                            <th colspan="2">Cummulative Semester Performance</th>
                                        </tr>
                                        <tr>
                                            <th>Credits Earned</th>
                                            <th>SGA</th>
                                            <th>Credits Earned</th>
                                            <th>SGA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>22</td>
                                            <td>7.82</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div
                                style="display: flex; justify-content: space-between; align-items: end; font-size: 1.5rem; margin-top:15rem;"
                            >
                                <div style="width: 33%">Date: 01/01/2022</div>
                                <div style="margin: 0 auto;">
                                    <img
                                        style="width: 200px; height: auto; margin-top: 1rem;"
                                        src="https://credebl-dev-user-certificate.s3.ap-south-1.amazonaws.com/certificates/college-logo.svg"
                                    />
                                </div>
                                <div style="width: 33%; text-align: end;">
                                    Controller of Examinations
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>`
        
;
      } catch { }
    }
  }
  