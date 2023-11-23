import { Injectable, Logger} from '@nestjs/common';

@Injectable()
export class ImageServiceService {

    private readonly logger = new Logger("Base64ImageService");
    constructor(
    ) { }

    getBase64Image(base64Image: string): Buffer {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        return imageBuffer;
    }

}
