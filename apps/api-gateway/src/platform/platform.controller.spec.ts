import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { SortValue } from './platform.model';

describe('Credentia lDefinitionController Test Cases', () => {
    let controller: PlatformController;
    const mockCredentialDefinitionService = {
        connectedHolderList: jest.fn(() => ({})),
      getCredentialListByConnectionId: jest.fn(() => ({})),
      pingServicePlatform: jest.fn(() => ({}))
    };
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PlatformController],
        providers: [PlatformService]
      })
        .overrideProvider(PlatformService)
        .useValue(mockCredentialDefinitionService)
        .compile();
      controller = module.get<PlatformController>(
        PlatformController
      );
    });
   
    describe('connected holder list', () => {
        const itemsPerPage: any = 1;
        const page: any = 1; 
        const searchText: any = 'abc';
        const orgId: any = 13; 
        const connectionSortBy: any = 'xyz'; 
        const sortValue: any = 'asdd';
      it('should return an expected connected holder list', async () => {
        const result = await controller.connectedHolderList(
            itemsPerPage,
            page, 
            searchText, 
            orgId, 
            connectionSortBy, 
            sortValue
        );
        expect(result).toEqual({});
      });
    });
    describe('get credential list by connection id', () => {
        const connectionId = 'jhkh';
        const itemsPerPage = 10;
        const page = 1; 
        const searchText = 'abc';
        const sortValue:any = SortValue;
        const credentialSortBy = 'ddcc';
      it('should return an expected credential list by connection id', async () => {
        const result = await controller.getCredentialListByConnectionId(
            connectionId, 
            itemsPerPage, 
            page, 
            searchText, 
            sortValue, 
            credentialSortBy
        );
        expect(result).toEqual({});
      });
    });
    describe('get the platform service status', () => {
      it('should return an expected platform service status', async () => {
        const result = await controller.pingServicePlatform();
        expect(result).toEqual({});
      });
    });
  });
  