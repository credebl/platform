import { Test, TestingModule } from '@nestjs/testing';

import { Any } from 'typeorm';
import { CredentialDefinitionController } from './credential-definition.controller';
import { CredentialDefinitionService } from './credential-definition.service';

describe('CredentialDefinitionController Test Cases', () => {
  let controller: CredentialDefinitionController;
    const mockCredentialDefinitionService = {
      createCredentialDefinition: jest.fn(() => ({})),
      getAllCredDefsByOrgId: jest.fn(() => ({})),
      getCredDefsByCredId: jest.fn(() => ({})),
      getAllCredentialDefinitionForHolder: jest.fn(() => ({}))
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [CredentialDefinitionController],
        providers: [CredentialDefinitionService]
      })
        .overrideProvider(CredentialDefinitionService)
        .useValue(mockCredentialDefinitionService)
        .compile();
      controller = module.get<CredentialDefinitionController>(
        CredentialDefinitionController
      );
    });
  describe('createCredential', () => {
    const user: any = {};
    user.orgId = 1234;
    const createCredentialDefinition: any = {
      schema_id: 'Test',
      tag: 'Test',
      support_revocation: true,
      support_auto_issue: true,
      revocation_registry_size: 0
    };
    it('should return an expected credentialdefinition', async () => {
      const result = await controller.createCredential(
        user,
        createCredentialDefinition
      );
      expect(result).toEqual({});
    });

    it('should check returned credentialdefinition is not to be null', async () => {
      const result = await controller.createCredential(
        user,
        createCredentialDefinition
      );
      expect(result).not.toBeNull();
    });
    it('should hit error if support_auto_issue is number', async () => {
      createCredentialDefinition.support_auto_issue = 1234;
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Support auto issue should be boolean.');
    });
    it('should hit error if support_auto_issue is empty', async () => {
      createCredentialDefinition.support_auto_issue = '';
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Please provide support auto issue data.');
    });
    it('should hit error if support_revocation is empty', async () => {
      createCredentialDefinition.support_revocation = '';
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Please provide support revocation data.');
    });
    it('should hit error if support_revocation is number', async () => {
      createCredentialDefinition.support_revocation = 1234;
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Support revocation should be boolean.');
    });
    it('should hit error if tag is empty', async () => {
      createCredentialDefinition.tag = '';
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Please provide a valid tag.');
    });
    it('should hit error if tag is number', async () => {
      createCredentialDefinition.tag = 1234;
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Tag should be a string.');
    });
    it('should hit error if schema_id is empty', async () => {
      createCredentialDefinition.schema_id = '';
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Please provide a schema id.');
    });
    it('should hit error if schema_id is number', async () => {
      createCredentialDefinition.schema_id = 1234;
      const result = await (() => {
        controller.createCredential(user, createCredentialDefinition);
      });
      expect(result).toThrowError('Schema id should be a string.');
    });
    //createCredential test case
    
  });
  describe('getAllCredDefsByOrgId', () => {
    const page: any = 'hello';
      const search_text: any = 'Test';
      const items_per_page: any = 1234;
      const orgId: any = 1234;
      const credDefSortBy: any = 1234;
      const sortValue: any = 1234;
      const supportRevocation: any = 'Test';
      const user: any = 1234;
    it('should return an expected credentialdefinition', async () => {
      const result = await controller.getAllCredDefsByOrgId(
        page,
        search_text,
        items_per_page,
        orgId,
        credDefSortBy,
        sortValue,
        supportRevocation,
        user
      );
      expect(result).toEqual({});
    });
    it('should return an expected credentialdefinition', async () => {
      const result = await controller.getAllCredDefsByOrgId(
        page,
        search_text,
        items_per_page,
        orgId,
        credDefSortBy,
        sortValue,
        supportRevocation,
        user
      );
      expect(result).not.toBeNull();
    });
  });
  // describe("getAllCredDefsByOrgId", () => {
  //   let page: any = "hello";
    
  //   it("should return an expected credentialdefinition", async () => {
  //     const result = await controller.getCredDefsByCredId(
  //       page,
  //       search_text,
        
  //     );
  //     expect(result).toEqual({});
  //   });
  //   it("should return an expected credentialdefinition", async () => {
  //     const result = await controller.getCredDefsByCredId(
  //       page,
  //       search_text,
        
  //     );
  //     expect(result).not.toBeNull();
  //   });
  // });
  describe('getAllCredentialDefinitionForHolder', () => {
    const page: any = 'hello';
      const search_text: any = 'Test';
      const items_per_page: any = 1234;
      const orgId: any = 1234;
      const credDefSortBy: any = 1234;
      const sortValue: any = 1234;
      const supportRevocation: any = 'Test';
      const user: any = 1234;
    it('should return an expected credentialdefinition', async () => {
      const result = await controller.getAllCredentialDefinitionForHolder(
        page,
        search_text,
        items_per_page,
        orgId,
        credDefSortBy,
        sortValue,
        supportRevocation,
        user
      );
      expect(result).toEqual({});
    });
    it('should return an expected credentialdefinition', async () => {
      const result = await controller.getAllCredDefsByOrgId(
        page,
        search_text,
        items_per_page,
        orgId,
        credDefSortBy,
        sortValue,
        supportRevocation,
        user
      );
      expect(result).not.toBeNull();
    });
  });
});
