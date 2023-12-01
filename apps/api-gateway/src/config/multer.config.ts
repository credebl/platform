import { HttpException, HttpStatus } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs';


// Multer upload options
export const multerCSVOptions =  {      
    storage: diskStorage({
        destination: (req, file, cb) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id } = req.body;
            const path = `./uploadedFiles/import`;
            fs.mkdirSync(path, { recursive: true });
            return cb(null, path);
        },
        filename: (req, file, cb) => {
            if (
                'text/csv' === file.mimetype
            ) {
                cb(null, `${file.originalname}`);
            } else {
              cb(new HttpException(`File format should be CSV`, HttpStatus.BAD_REQUEST), '');
            }
        }
    })
};
