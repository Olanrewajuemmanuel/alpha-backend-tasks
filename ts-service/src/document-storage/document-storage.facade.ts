import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

export interface IUploadDocumentSchema {
    upload: (path: string, mimeType: string, file: Buffer, originalName?: string) => Promise<void>;
    mimeType: (path: string) => string;
    delete: (path: string) => Promise<void>;
    getUTF8: (file: Buffer) => string;
}

@Injectable()
export class DocumentStorageFacade implements IUploadDocumentSchema {

    async upload(path: string, mimeType: string, file: Buffer, originalName?: string): Promise<void> {
        const extension = originalName ? originalName.split('.').pop() : this.mimeType(path);
        const pathWithExt = extension ? `${path}.${extension}` : path;
        const relativePath = join('uploads', pathWithExt);
        const absolutePath = join(process.cwd(), relativePath);
        const directoryPath = join(process.cwd(), 'uploads', pathWithExt.split('/').slice(0, -1).join('/'));

        await mkdir(directoryPath, { recursive: true });

        await writeFile(absolutePath, file)
        
    }

    mimeType(path: string): string {
        const filename = path.split('/').pop();
        const ext = filename?.split('.').pop();
        return ext || '';
    }
    async delete(path: string): Promise<void> {
        const absolutePath = join(process.cwd(), 'uploads', path);
        
        await writeFile(absolutePath, Buffer.alloc(0));
    }
    
    getUTF8(file: Buffer): string {
        return file.toString('utf-8');
    }
    
}