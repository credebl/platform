import { Attribute, IIssueCertificate } from '../interfaces/user.interface';

export class DegreeCertificateTemplate {
  findAttributeByName(attributes: Attribute[], name: string): Attribute {
    return attributes.find((attr) => name in attr);
  }

  async getDegreeCertificateTemplate(attributes: Attribute[], qrCode: string): Promise<string> {
    try {
      const {
        slNo,
        date,
        studentName,
        programme,
        courseDetails,
        universityName,
        type,
        semester,
        academicYear,
        currentSemesterPerformanceCreditsEarned,
        commulativeSemesterPerformanceCreditsEarned,
        currentSemesterPerformanceSGA,
        commulativeSemesterPerformanceSGA,
        registrationNo,
        year
      } = await Promise.all(attributes).then((attributes) => {
        const slNo = this.findAttributeByName(attributes, 'slNo')?.slNo ?? '';
        const date = this.findAttributeByName(attributes, 'date')?.date ?? '';
        const studentName = this.findAttributeByName(attributes, 'studentName')?.studentName ?? '';
        const programme = this.findAttributeByName(attributes, 'programme')?.programme ?? '';
        const courseDetails = this.findAttributeByName(attributes, 'courseDetails')?.courseDetails ?? '';
        const universityName = this.findAttributeByName(attributes, 'universityName')?.universityName ?? '';
        const semester = this.findAttributeByName(attributes, 'semester')?.semester ?? '';
        const type = this.findAttributeByName(attributes, 'type')?.type ?? '';
        const academicYear = this.findAttributeByName(attributes, 'academicYear')?.academicYear ?? '';
        const year = this.findAttributeByName(attributes, 'year')?.year ?? '';
        const currentSemesterPerformanceCreditsEarned =
          this.findAttributeByName(attributes, 'currentSemesterPerformance-creditsEarned')?.[
            'currentSemesterPerformance-creditsEarned'
          ] ?? '';
        const commulativeSemesterPerformanceCreditsEarned =
          this.findAttributeByName(attributes, 'commulativeSemesterPerformance-creditsEarned')?.[
            'commulativeSemesterPerformance-creditsEarned'
          ] ?? '';
        const currentSemesterPerformanceSGA =
          this.findAttributeByName(attributes, 'currentSemesterPerformance-SGA')?.['currentSemesterPerformance-SGA'] ??
          '';
        const commulativeSemesterPerformanceSGA =
          this.findAttributeByName(attributes, 'commulativeSemesterPerformance-SGA')?.[
            'commulativeSemesterPerformance-SGA'
          ] ?? '';
        const registrationNo = this.findAttributeByName(attributes, 'registrationNo')?.registrationNo ?? '';

        const refinedObj = {
            slNo,
            date,
            studentName,
            programme,
            courseDetails,
            universityName,
            type,
            semester,
            academicYear,
            year,
            currentSemesterPerformanceCreditsEarned,
            commulativeSemesterPerformanceCreditsEarned,
            currentSemesterPerformanceSGA,
            commulativeSemesterPerformanceSGA,
            registrationNo
          };

        return refinedObj;
      });

      const courseDetailsJSON: IIssueCertificate[] = courseDetails && JSON.parse(courseDetails);
      return `
        <!DOCTYPE html>
                    <html lang="en">
                        <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                    
                            <link rel="preconnect" href="https://fonts.googleapis.com" />
                            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                            <link
                                href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap"
                                rel="stylesheet"
                            />
                            <link href="https://fonts.googleapis.com/css2?family=Berkshire+Swash&family=Inter:wght@500&display=swap" rel="stylesheet">
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
                                    border-bottom: none;
                                    text-align: center;
                                }
                                td.course {
                                    text-align: start;
                                }
                                tr:last-child {
                                    border-bottom: 1px solid black;
                                }
                                h1 {
                                    color: #d15b1e;
                                    font-family: 'Berkshire Swash', serif;
                                }
                                body {
                                    font-family: 'Inter', sans-serif;
                                }
                            </style>
                        </head>
                        <body>
                            <div style="line-height: 1;width: 1260px;height: 1977px;">
                                <div style="position: relative;">
                                    <div style="">
                                        <img style="width: 1260px" src="https://credebl-dev-user-certificate.s3.ap-south-1.amazonaws.com/certificates/uni-frame.svg" />
                                    </div>
                                </div>
                                <div style="position: absolute;top: 0px;width: calc(1260px - 10rem);height: calc(1977px - 10rem);padding: 5rem;padding-left: 5rem;padding-right: 5rem;">
                                    <div style="display: flex; justify-content: center;">
                                        <div>
                                            <img
                                                style="width: 200px; height: auto; margin-top: 1rem;"
                                                src="https://credebl-dev-user-certificate.s3.ap-south-1.amazonaws.com/certificates/college-color-logo.svg"
                                            />
                                        </div>
                                        <div
                                            style="position: absolute; top: 5rem; right: 5rem; font-size: 24px;"
                                        >
                                            SL.No : ${slNo}
                                        </div>
                                    </div>
                                    <div
                                        style="text-align: center; display: flex; flex-direction: column; align-items: center;"
                                    >
                                        <h1 style="font-size: 3em; line-height: 1; padding: 0 4rem;">${universityName}</h1>
                                        <h3 style="font-size: 1.2em; color: rgb(5, 148, 170);">Pune, Maharashtra, (M.S.) India, 410061</h3>
                                        <!-- <p>Government Aided Autonomous Institute</p> -->
                                        <div
                                            style="position: relative;width: 100%;margin: 0.5rem 0;line-height: 0.75;display: flex;justify-content: center;"
                                        >
                                            <div style="padding: 1rem 6rem; width: fit-content;">
                                                <h1 style="font-size: 3em; line-height: 1"> ${type}</h1>
                                            <p style="font-size: 1.2rem;">(Academic Year ${academicYear})</p>
                                            </div>
                                            <div id="qr-code" style="position: absolute; top: -1rem; right: 1rem;">
                                                <svg width="100%" style="display: none;width: 150px;" height="100%" viewBox="-1 -1 31 31" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" shape-rendering="crispEdges" id="qr code"><rect id="qr background" fill-opacity="1" fill="rgb(255, 255, 255)" x="-1" y="-1" width="31" height="31"></rect><path fill-opacity="1" fill="rgb(0, 0, 0)" id="qr dark pixels" fill-rule="evenodd" d="M 8 0 L 9 0 L 9 1 L 11 1 L 11 2 L 9 2 L 9 3 L 8 3 z M 12 0 L 13 0 L 13 1 L 12 1 z M 15 0 L 17 0 L 17 1 L 18 1 L 18 2 L 19 2 L 19 3 L 20 3 L 20 4 L 18 4 L 18 3 L 17 3 L 17 2 L 15 2 z M 19 0 L 21 0 L 21 3 L 20 3 L 20 2 L 19 2 z M 13 1 L 14 1 L 14 3 L 13 3 L 13 4 L 12 4 L 12 2 L 13 2 z M 9 3 L 10 3 L 10 5 L 9 5 z M 14 3 L 16 3 L 16 7 L 17 7 L 17 5 L 20 5 L 20 7 L 19 7 L 19 6 L 18 6 L 18 8 L 17 8 L 17 10 L 16 10 L 16 8 L 15 8 L 15 6 L 14 6 L 14 8 L 13 8 L 13 6 L 12 6 L 12 9 L 14 9 L 14 10 L 15 10 L 15 11 L 14 11 L 14 12 L 13 12 L 13 13 L 12 13 L 12 14 L 13 14 L 13 15 L 12 15 L 12 17 L 13 17 L 13 16 L 14 16 L 14 17 L 15 17 L 15 18 L 12 18 L 12 19 L 11 19 L 11 17 L 8 17 L 8 16 L 11 16 L 11 12 L 12 12 L 12 11 L 13 11 L 13 10 L 11 10 L 11 8 L 10 8 L 10 7 L 11 7 L 11 4 L 12 4 L 12 5 L 15 5 L 15 4 L 14 4 z M 8 5 L 9 5 L 9 6 L 8 6 z M 9 6 L 10 6 L 10 7 L 9 7 z M 8 7 L 9 7 L 9 9 L 10 9 L 10 10 L 8 10 z M 2 8 L 5 8 L 5 9 L 7 9 L 7 10 L 6 10 L 6 11 L 5 11 L 5 10 L 1 10 L 1 11 L 2 11 L 2 12 L 0 12 L 0 9 L 2 9 z M 20 8 L 24 8 L 24 9 L 23 9 L 23 10 L 21 10 L 21 11 L 20 11 L 20 13 L 19 13 L 19 14 L 18 14 L 18 16 L 17 16 L 17 14 L 16 14 L 16 13 L 17 13 L 17 11 L 18 11 L 18 10 L 20 10 z M 26 8 L 29 8 L 29 12 L 28 12 L 28 13 L 27 13 L 27 14 L 25 14 L 25 13 L 24 13 L 24 12 L 26 12 L 26 11 L 24 11 L 24 10 L 25 10 L 25 9 L 26 9 L 26 10 L 28 10 L 28 9 L 26 9 z M 10 10 L 11 10 L 11 11 L 10 11 z M 6 11 L 10 11 L 10 12 L 6 12 z M 23 11 L 24 11 L 24 12 L 23 12 z M 4 12 L 5 12 L 5 14 L 4 14 L 4 15 L 5 15 L 5 16 L 6 16 L 6 17 L 7 17 L 7 18 L 6 18 L 6 19 L 7 19 L 7 20 L 6 20 L 6 21 L 5 21 L 5 20 L 4 20 L 4 19 L 3 19 L 3 17 L 2 17 L 2 16 L 3 16 L 3 14 L 0 14 L 0 13 L 4 13 zM 4 17 L 5 17 L 5 18 L 4 18 z M 15 12 L 16 12 L 16 13 L 15 13 z M 21 12 L 22 12 L 22 13 L 21 13 z M 6 13 L 10 13 L 10 15 L 9 15 L 9 14 L 6 14 z M 14 13 L 15 13 L 15 14 L 14 14 z M 5 14 L 6 14 L 6 15 L 5 15 z M 19 14 L 20 14 L 20 15 L 19 15 z M 22 14 L 23 14 L 23 16 L 24 16 L 24 14 L 25 14 L 25 15 L 26 15 L 26 16 L 25 16 L 25 17 L 19 17 L 19 18 L 18 18 L 18 20 L 17 20 L 17 17 L 18 17 L 18 16 L 20 16 L 20 15 L 21 15 L 21 16 L 22 16 z M 27 14 L 29 14 L 29 15 L 28 15 L 28 16 L 29 16 L 29 17 L 27 17 z M 0 15 L 2 15 L 2 16 L 0 16 z M 6 15 L 7 15 L 7 16 L 6 16 z M 25 17 L 26 17 L 26 18 L 25 18 z M 7 18 L 10 18 L 10 19 L 7 19 z M 21 18 L 22 18 L 22 19 L 23 19 L 23 20 L 21 20 z M 26 18 L 28 18 L 28 19 L 29 19 L 29 20 L 26 20 L 26 21 L 25 21 L 25 20 L 24 20 L 24 19 L 26 19 z M 1 19 L 3 19 L 3 20 L 2 20 L 2 21 L 1 21 z M 10 19 L 11 19 L 11 21 L 12 21 L 12 22 L 13 22 L 13 23 L 12 23 L 12 24 L 9 24 L 9 23 L 11 23 L 11 22 L 9 22 L 9 20 L 10 20 z M 12 19 L 14 19 L 14 20 L 15 20 L 15 22 L 14 22 L 14 21 L 12 21 z M 15 19 L 16 19 L 16 20 L 15 20 z M 3 20 L 4 20 L 4 21 L 3 21 z M 7 20 L 8 20 L 8 21 L 7 21 z M 18 20 L 19 20 L 19 21 L 18 21 z M 16 21 L 17 21 L 17 22 L 16 22 z M 19 21 L 20 21 L 20 22 L 19 22 z M 21 21 L 24 21 L 24 24 L 21 24 zM 22 22 L 23 22 L 23 23 L 22 23 z M 26 21 L 29 21 L 29 23 L 27 23 L 27 22 L 26 22 z M 18 22 L 19 22 L 19 23 L 20 23 L 20 24 L 19 24 L 19 25 L 18 25 L 18 26 L 19 26 L 19 25 L 20 25 L 20 26 L 21 26 L 21 28 L 23 28 L 23 27 L 25 27 L 25 28 L 24 28 L 24 29 L 20 29 L 20 27 L 18 27 L 18 28 L 15 28 L 15 29 L 12 29 L 12 27 L 13 27 L 13 26 L 11 26 L 11 27 L 10 27 L 10 28 L 9 28 L 9 27 L 8 27 L 8 24 L 9 24 L 9 26 L 10 26 L 10 25 L 14 25 L 14 23 L 15 23 L 15 27 L 17 27 L 17 24 L 16 24 L 16 23 L 18 23 z M 25 23 L 27 23 L 27 24 L 28 24 L 28 26 L 27 26 L 27 25 L 26 25 L 26 24 L 25 24 z M 22 25 L 25 25 L 25 26 L 22 26 z M 28 26 L 29 26 L 29 27 L 28 27 z M 27 27 L 28 27 L 28 28 L 29 28 L 29 29 L 27 29 z M 18 28 L 19 28 L 19 29 L 18 29 z M 25 28 L 26 28 L 26 29 L 25 29 z"></path><path id="qr squares" d="M0,0h7h0v0v7v0h0h-7h0v0v-7v0h0zM1,1h5h0v0v5v0h0h-5h0v0v-5v0h0zM2,2h3h0v0v3v0h0h-3h0v0v-3v0h0z M22,0h7h0v0v7v0h0h-7h0v0v-7v0h0zM23,1h5h0v0v5v0h0h-5h0v0v-5v0h0zM24,2h3h0v0v3v0h0h-3h0v0v-3v0h0z M0,22h7h0v0v7v0h0h-7h0v0v-7v0h0zM1,23h5h0v0v5v0h0h-5h0v0v-5v0h0zM2,24h3h0v0v3v0h0h-3h0v0v-3v0h0z" fill-rule="evenodd" fill-opacity="1" fill="rgb(0, 0, 0)"></path></svg>
                                            <img src="${qrCode}" style="width: 250px;" height='250px'" alt="QR Code" />
                                                </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style="text-align: start; font-size: 1.5rem; line-height: 2;">
                                            <h5>Name of the Student : ${studentName}</h5>
                                            <h5>Programme : ${programme}</h5>
                                            <div style="display: flex; justify-content: space-between;">
                                                <h5>Year : ${year}</h5>
                                                <h5>Semester : ${semester}</h5>
                                                <h5>Registration Number : ${registrationNo}</h5>
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
                                                        <th>Obtained Earned</th>
                                                        <th>Grade Credits</th>
                                                        <th>Obtained Earned</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                ${
                                                    courseDetailsJSON?.map((item: IIssueCertificate) => (
                                                        `<tr>
                                                            <td class="course">${item.courseCode}</td>
                                                            <td class="course">${item.courseName}</td>
                                                            <td>${item.theoryGradeCredits}</td>
                                                            <td>${item.theoryObtainedEarned}</td>
                                                            <td>${item.practicalGradeCredits}</td>
                                                            <td>${item.practicalObtainedEarned}</td>
                                                        </tr>`
                                                    ))
                                                }
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
                                                        <td>${currentSemesterPerformanceCreditsEarned}</td>
                                                        <td>${currentSemesterPerformanceSGA}</td>
                                                        <td>${commulativeSemesterPerformanceCreditsEarned}</td>
                                                        <td>${commulativeSemesterPerformanceSGA}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div
                                            style="display: flex;justify-content: space-between;align-items: end;font-size: 1.5rem;position: absolute;width: calc(1260px - 10rem);bottom: 6rem;"
                                        >
                                            <div style="width: 33%">Date: ${date}</div>
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
                    </html>
        `;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`Degree temlpate ERROR::: ${JSON.stringify(error)}`);
    }
  }
}
