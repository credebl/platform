export const ResponseMessages = {
  user: {
    success: {
      create: 'User registered successfully',
      update: 'User details updated successfully',
      emaiVerified: 'Email verified successfully',
      fetchClientAliases: 'Client aliases fetched successfully',
      login: 'User login successfully',
      fetchSession: 'Session details fetched successfully',
      fetchProfile: 'User fetched successfully',
      fetchInvitations: 'Org invitations fetched successfully',
      invitationReject: 'Organization invitation rejected',
      invitationAccept: 'Organization invitation accepted',
      fetchUsers: 'Users fetched successfully',
      newUser: 'User not found',
      checkEmail: 'User email checked successfully.',
      sendVerificationCode: 'Verification link has been successfully sent on the email. Please verify',
      userActivity: 'User activities fetched successfully',
      platformSettings: 'Platform settings updated',
      fetchPlatformSettings: 'Platform settings fetched',
      signUpUser: 'User created successfully',
      updateUserProfile: 'User profile updated successfully',
      resetPassword: 'Password reset successfully',
      resetPasswordLink: 'Reset password link has been sent to your mail',
      refreshToken: 'Token details fetched successfully',
      countriesVerificationCode: 'All countries has been fetched successfully',
      stateVerificationCode: 'All states has been fetched successfully',
      cityVerificationCode: 'All cities has been fetched successfully',
      logout: 'User logout successfully',
      fetchAllSession: 'User Sessions fetched Successfully',
      sessionDelete: 'Session deleted Successfully'
    },
    error: {
      exists: 'User already exists',
      profileNotFound: 'User public profile not found',
      notUpdatePlatformSettings: 'Unable to update platform config settings',
      platformSetttingsNotFound: 'Unable to get platform settings',
      verificationAlreadySent: 'The verification link has already been sent to your email address',
      emailSend: 'Unable to send email to the user',
      redirectUrlNotFound: 'Redirect URL not found',
      invalidEmailUrl: 'Invalid verification code or EmailId!',
      verifiedEmail: 'Email already verified',
      notFound: 'User not found',
      sessionLimitReached:
        'You have reached the maximum number of allowed sessions. Please remove an existing session to add a new one',
      verifyMail: 'Please verify your email',
      invalidCredentials: 'Invalid Credentials',
      registerFido: 'Please complete your fido registration',
      invitationNotFound: 'Invitation not found for this user',
      invitationAlreadyAccepted: 'Organization invitation already accepted',
      invitationAlreadyRejected: 'Organization invitation already rejected',
      invalidInvitationStatus: 'Invalid invitation status',
      invalidKeycloakId: 'keycloakId is invalid',
      invalidEmail: 'Invalid Email Id!',
      adduser: 'Unable to add user details',
      userRoleNotFound: 'User role not found',
      verifyEmail: 'The verification link has already been sent to your email address. please verify',
      emailNotVerified: 'The verification link has already been sent to your email address. please verify',
      userNotRegisterd: 'The user has not yet completed the registration process',
      InvalidEmailDomain: 'Email from this domain is not allowed',
      invalidOrgId: 'Organization does not exist',
      invalidInvitationId: 'Organization invitation does not exist',
      invitationAlreadyPending: 'Organization invitation is already in pending state',
      emailIsNotVerified: 'Email is not verified',
      invitationStatusUpdateInvalid: 'Status update is invalid. Request is already',
      resetSamePassword: 'New password should not be the current password',
      resetPasswordLink: 'Unable to create reset password token',
      invalidResetLink: 'Invalid or expired reset password link',
      invalidAccessToken: 'Authentication failed',
      invalidRefreshToken: 'Invalid refreshToken provided',
      userOrgsLimit: 'Limit reached: You can be associated with or create maximum 10 organizations.',
      errorInUpdateAccountDetails: 'Error in updating the account details',
      errorInDeleteSession: 'Error in deleting the session',
      errorInSessionCreation: 'Error in create session',
      userAccountNotFound: 'User account not found',
      userSessionNotFound: 'User session not found',
      refreshTokenExpired: 'Refresh token has expired'
    }
  },
  organisation: {
    success: {
      create: 'Organization created successfully',
      update: 'Organization updated successfully',
      fetchProfile: 'Organization profile fetched successfully',
      fetchOrgRoles: 'Organization roles fetched successfully',
      createInvitation: 'Organization invitations sent',
      getInvitation: 'Organization invitations fetched successfully',
      getOrganization: 'Organization details fetched successfully',
      getOrgDashboard: 'Organization dashboard details fetched',
      getOrganizations: 'Organizations details fetched successfully',
      updateUserRoles: 'User roles updated successfully',
      delete: 'Organization deleted successfully',
      orgInvitationDeleted: 'Organization invitation deleted successfully',
      orgCredentials: 'Client credentials created successfully',
      fetchedOrgCredentials: 'Organization credentials fetched successfully',
      clientCredentials: 'Client credentials fetched successfully',
      deleteCredentials: 'Organization client credentials deleted',
      orgDids: 'Organization DIDs fetched successfully',
      primaryDid: 'Primary DID updated successfully',
      didDetails: 'DID Details updated sucessfully',
      getOrganizationActivity: 'Organization activity count fetched successfully'
    },
    error: {
      exists: 'An organization name is already exist',
      orgProfileNotFound: 'Organization public profile not found',
      orgSlugIsRequired: 'orgSlug is required',
      invitationIdIsRequired: 'Invitation Id is required',
      userIdIsRequired: 'UserId is required',
      rolesNotExist: 'Provided roles not exists in the platform',
      orgProfile: 'Organization profile not found',
      userNotFound: 'User not found for the given organization',
      orgRoleIdNotFound: 'Provided roles not exists for this organization',
      updateUserRoles: 'Unable to update user roles',
      deleteOrg: 'Organization not found',
      deleteOrgInvitation: 'Organization does not have access to delete this invitation',
      notFound: 'Organization agent not found',
      orgNotFound: 'Organization does not exists',
      orgDataNotFoundInkeycloak: 'Organization not found in keycloak',
      orgNotMatch: 'Organization does not have access',
      invitationStatusInvalid: 'Unable to delete invitation with accepted/rejected status',
      credentialsNotUpdate: 'Unable to update organization credentials',
      invalidOrgId: 'Invalid format for orgId',
      orgIdIsRequired: 'OrgId is required',
      clientIdRequired: 'clientId is required',
      notExistClientCred: 'Organization does not have client credentials',
      invalidUserId: 'Invalid format of userId',
      invalidInvitationId: 'Invalid format for invitation id',
      roleNotMatch: 'User does not have access',
      orgDoesNotMatch: 'Organization does not match',
      invalidClient: 'Invalid client credentials',
      primaryDid: 'This DID is already set to primary DID',
      didNotFound: 'DID does not exist in organiation',
      organizationNotFound: 'Organization not found',
      MaximumOrgsLimit: 'Limit reached: You can be associated with or create maximum 10 organizations.',
      adminTokenDetails: 'Error in generating admin token details',
      clientDetails: 'Error in fetching client details',
      invalidClientCredentials: 'Invalid client credentials'
    }
  },

  fido: {
    success: {
      RegistrationOption: 'Registration option created successfully',
      verifyRegistration: 'Verify registration successfully',
      updateUserDetails: 'User details updated successfully',
      generateAuthenticationOption: 'Authentication option generated successfully',
      deleteDevice: 'Device deleted successfully',
      updateDeviceName: 'Device name updated successfully',
      login: 'User login successfully'
    },
    error: {
      exists: 'User already exists',
      verification: 'Fail to verify user',
      verificationAlreadySent: 'The verification link has already been sent to your email address',
      generateRegistration: 'Unable to generate registration option for user',
      verifiedEmail: 'Email already verified',
      deviceNotFound: 'Device does not exist or revoked',
      updateFidoUser: 'Error in updating fido user.',
      invalidCredentials: 'Invalid Credentials',
      registerFido: 'Please complete your fido registration'
    }
  },

  schema: {
    success: {
      fetch: 'Schema retrieved successfully.',
      create: 'Schema created successfully.',
      update: 'Schema updated successfully'
    },
    error: {
      invalidSchemaId: 'Please provide valid schema Id',
      invalidData: 'Invalid data provided.',
      nameNotEmpty: 'Schema name is required',
      versionNotEmpty: 'Schema version is required',
      invalidVersion: 'Invalid schema version provided.',
      insufficientAttributes: 'Please provide at least one attribute.',
      uniqueAttributesnames: 'Please provide unique attribute names',
      uniqueAttributesDisplaynames: 'Please provide unique display names for attributes',
      emptyData: 'Please provide data for creating schema.',
      exists: 'Schema already exists',
      notCreated: 'Schema not created',
      notFound: 'Schema records not found',
      schemaIdNotFound: 'SchemaLedgerId not found',
      credentialDefinitionNotFound: 'No credential definition exist',
      notStoredCredential: 'User credential not stored',
      agentDetailsNotFound: 'Agent details not found',
      failedFetchSchema: 'Failed to fetch schema data',
      atLeastOneRequired: 'At least one of the attributes should have isReuired as `true`',
      schemaBuilder: 'Error while creating schema JSON',
      schemaUploading: 'Error while uploading schema JSON',
      W3CSchemaNotFOund: 'Error while resolving W3C schema',
      storeW3CSchema: 'Error while storing W3C schema',
      networkNotFound: 'Error while fetching network',
      orgDidAndSchemaType: 'Organization DID and schema type does not match'
    }
  },
  credentialDefinition: {
    success: {
      fetch: 'Credential definition fetched successfully.',
      create: 'Credential definition created successfully.',
      template: 'Credential template fetched successfully.'
    },
    error: {
      NotFound: 'No credential definitions found.',
      NotSaved: 'Error in saving credential definition.',
      Conflict: 'Credential definition already exists',
      schemaIdNotFound: 'SchemaLedgerId not found',
      isRequired: 'Credential definition Id is required',
      OrgDidNotFound: 'OrgDid not found',
      credDefIdNotFound: 'Credential Definition Id not found',
      InvalidSchemaType: 'Invalid schema type or not supported yet'
    }
  },
  ledger: {
    success: {
      fetch: 'Ledger details retrieved successfully.',
      fetchNetworkUrl: 'Network url retrieved successfully'
    },
    error: {
      NotFound: 'No ledgers found.',
      indyNamespaceisRequired: 'indyNamespace is a required'
    }
  },
  agent: {
    success: {
      create: 'Organization wallet created successfully',
      createWallet: 'Wallet created successfully',
      createDid: 'Did created successfully',
      health: 'Agent health details retrieved successfully.',
      ledgerConfig: 'Ledger config details fetched successfully.',
      sign: 'Payload signed successfully.',
      verify: 'Payload verified successfully.',
      webhookUrlRegister: 'Webhook Url registered successfully',
      getWebhookUrl: 'Webhook Url fetched successfully',
      createKeys: 'Key-pair created successfully',
      walletDelete: 'The wallet has been deleted.'
    },
    error: {
      exists: 'An agent name is already exist',
      orgNotFound: 'Organization not found',
      apiEndpointNotFound: 'apiEndpoint not found',
      notAbleToSpinUpAgent: 'Agent not able to spin up',
      alreadySpinUp: 'Agent already spun up',
      agentUrl: 'Agent url not exist',
      apiKeyNotExist: 'API key is not found',
      walletNotDeleted: 'Wallet is not deleted, Please check',
      seedChar: 'seed must be at most 32 characters',
      validWalletName: 'Please enter valid wallet name. It allows only alphanumeric values',
      platformConfiguration: 'Platform configuration is missing or invalid',
      apiEndpoint: 'API endpoint is missing in the platform configuration',
      externalIp: 'External IP is missing in the platform configuration',
      stringExternalIp: 'External IP must be a string',
      agentProcess: 'Agent process is invalid or not in a completed state',
      notAbleToSpinup: 'Agent not able to spun up',
      ledgerNotFound: 'Ledgers not found',
      agentNotExists: 'Agent not spun up for this organization',
      agentDown: 'Agent is down or not spun up',
      notConfigured: 'Agent is not configured properly',
      walletAlreadyCreated: 'Your wallet is already been created',
      walletAlreadyProcessing: 'Your wallet is already processing',
      notAbleToSpinp: 'Agent not able to spun up',
      platformAdminNotAbleToSpinp: 'Platform admin agent is not spun up',
      invalidLedger: 'Invalid ledger name',
      seedCharCount: 'seed must be at most 32 characters',
      nullTenantId: 'TenantId must not be null',
      tenantIdNotFound: 'TenantId not found',
      invalidTenantIdIdFormat: 'Invalid tenantId format',
      requiredTenantId: 'Tenant Id is required',
      createDid: 'Error while creating DID',
      networkMismatch: 'The network is mismatched.',
      didAlreadyExist: 'DID already exist',
      storeDid: 'Error while storing DID',
      noLedgerFound: 'No ledger data not found.',
      agentSpinupError: 'Agent endpoint unreachable',
      agentEndpointRequired: 'Agent endpoint is required',
      failedAgentType: 'Agent endpoint is required',
      failedApiKey: 'Failed to encrypt API key',
      failedOrganization: 'Failed to fetch organization agent type details',
      promiseReject: 'One or more promises were rejected.',
      orgAgentNotFound: 'Org agent type not found',
      walletDoesNotExists: 'Organization wallet does not exists',
      requiredDomain: 'Domain is required for Web method',
      requiredNetwork: 'Network is required',
      keyType: 'Only ed25519 key type is supported',
      keyTypeWeb: 'Only ed25519 and bls12381g2 key type is supported',
      requiredEndorserDid: 'Role or endorser DID is required',
      requiredPrivateKey: 'Privatekey is required for polygon method',
      privateKeyLength: 'Private key must be exactly 64 characters long',
      requiredSeed: 'Seed is required',
      baseWalletToken: 'Error while fetching base wallet token',
      tenantWalletToken: 'Error while fetching tenant wallet token',
      invalidTenantDetails: 'Invalid wallet details provided'
    }
  },
  connection: {
    success: {
      create: 'Connection created successfully',
      receivenvitation: 'Invitation received successfully',
      fetchConnection: 'Connection details fetched successfully',
      fetch: 'Connections details fetched successfully',
      questionAnswerRecord: 'Question Answer record fetched successfully',
      questionSend: 'Question sent successfully',
      deleteConnectionRecord: 'Connection records deleted',
      basicMessage: 'Basic message sent successfully'
    },
    error: {
      invalidConnectionId: 'Invalid format for connectionId',
      exists: 'Connection is already exist',
      connectionNotFound: 'Connection not found',
      agentEndPointNotFound: 'agentEndPoint Not Found',
      agentUrlNotFound: 'agent url not found',
      connectionRecordNotFound: 'Connection records does not exists',
      removeConnectionReferences: 'First you have to remove credentials data and verification data'
    }
  },
  issuance: {
    success: {
      create: 'Credentials offer created successfully',
      partiallyOfferCreated: 'Credential offer created partially',
      createOOB: 'Out-of-band credentials offer created successfully',
      fetch: 'Issued Credential details fetched successfully',
      importCSV: 'File imported successfully',
      previewCSV: 'File details fetched successfully',
      bulkIssuance: 'Issuance process started. It will take some time',
      notFound: 'Schema records not found',
      bulkProcess: 'Process initiated for bulk issuance',
      deleteIssuanceRecords: 'Issuance records deleted',
      fileDetailsAndFileData: 'File details and File data fetched successfully'
    },
    error: {
      invalidCredentialRecordId: 'Please provide valid credential Record Id',
      exists: 'Credentials is already exist',
      credentialsNotFound: 'Credentials not found',
      agentEndPointNotFound: 'Agent details not found',
      organizationNotFound: 'organization Not Found',
      agentUrlNotFound: 'agent url not found',
      notFound: 'History not found',
      credentialOfferNotFound: 'Credential offer not found',
      invitationNotFound: 'Invitation not found',
      unableToCreateOOBOffer: 'Unable to create out-of-band credential offer',
      platformConfigNotFound: 'Platform config details not found',
      emailSend: 'Unable to send email to the user',
      previewFile: 'Error while fetching file details',
      previewCachedData: 'Error while fetching cached data',
      emptyFileData: 'File details does not exit or removed',
      cacheTimeOut: 'Timeout for reviewing data, re-upload your file and generate new request',
      fileNotFound: 'File details not found',
      fileData: 'File data does not exist for the specific file',
      retry: 'Credentials do not exist for retry',
      walletError: 'Credential Issuance failed due to error in Wallet Agent',
      emailIdNotPresent: 'EmailId is empty or not present',
      attributesNotPresent: 'Attributes are not present or not empty',
      unableToCreateOffer: 'Unable to create offer',
      orgAgentTypeNotFound: 'Organization agent type not found',
      credentialNotPresent: 'credential is required',
      optionsNotPresent: 'options are required',
      attributesAreRequired: 'attributes are required',
      invalidCredentialType: 'invalid credential type',
      missingRequestId: 'Param requestId is missing from the request.',
      cachedData: 'Cached data does not exist',
      cachedfileData: 'Cached file data does not exist',
      storeBulkData: 'Error while storing the bulk deata',
      issuanceRecordsNotFound: 'Issuance records does not exists',
      removeIssuanceData: 'First you have to remove issuance data',
      ledgerMismatched: `Organization ledger mismatch detected. This template cannot be used. Please use a template created with the organization's specific ledger`
    }
  },
  verification: {
    success: {
      fetch: 'Proof presentations details fetched successfully.',
      create: 'Presentation of proof received successfully.',
      verifiedProofDetails: 'Proof presentation details fetched successfully.',
      send: 'Proof request send successfully.',
      verified: 'Proof presentation verified successfully.',
      deleteVerificationRecord: 'Verification records deleted'
    },
    error: {
      notFound: 'Organization agent not found',
      proofNotSend: 'Proof request is not sent',
      invalidProofId: 'Please provide valid proofId',
      agentUrlNotFound: 'agent url not found',
      schemaIdNotFound: 'Schema Id is required',
      predicatesValueNotNumber: 'Attribute value is not a number',
      proofPresentationNotFound: 'Proof presentations not found',
      verifiedProofNotFound: 'Proof presentation not found',
      proofNotFound: 'Proof presentation not found',
      invitationNotFound: 'Invitation not found',
      platformConfigNotFound: 'Platform config not found',
      batchEmailSend: 'Unable to send email in batches',
      emailSend: 'Unable to send email to the user',
      verificationRecordsNotFound: 'Verification records does not exists',
      removeVerificationData: 'First you have to remove verification data',
      uniqueAttributes: 'Please provide unique attribute names'
    }
  },

  bulkIssuance: {
    success: {
      create: 'Issuance process initiated successfully',
      reinitiated: 'Process reinitiated for bulk issuance'
    },
    error: {
      PathNotFound: 'Path to export data not found.',
      invalidtemplateId: 'Invalid template id.',
      invalidIdentifier: 'Invalid Identifier',
      exportFile: 'An error occurred during CSV export.',
      emailColumn: '1st column of the file should always be email_identifier.',
      attributeNumber: 'Number of supplied values is different from the number of schema attributes.',
      mismatchedAttributes: 'Schema attributes are mismatched in the file header.',
      mismatchedSchemaType: 'The provided schema type does not match the template ID schema type',
      fileDetailsNotFound: 'File details not found.',
      emptyFile: 'File data is empty',
      emptyheader: 'File header is empty',
      invalidEmails: 'Invalid emails found in the chosen file'
    }
  },
  errorMessages: {
    forbidden: 'Forbidden Resource',
    badRequest: 'Bad Request',
    conflict: 'Conflict',
    notAcceptable: 'Not Acceptable',
    notFound: 'Not Found',
    serverError: 'Internal Server error'
  },

  webhook: {
    success: {
      webhookUrlRegister: 'Webhook Url registered successfully',
      getWebhookUrl: 'Webhook Url fetched successfully'
    },
    error: {
      registerWebhook: 'Unable to register a webhook url',
      webhookResponse: 'Error in sending webhook response to org webhook url',
      notFound: 'Webhook url not found'
    }
  },
  shorteningUrl: {
    success: {
      getshorteningUrl: 'Shortening Url fetched successfully',
      createShorteningUrl: 'Shortening Url created successfully'
    },
    error: {
      deepLinkDomainNotFound: 'Deeplink Domain not found. Please make sure to add it in your environment variables'
    }
  },
  notification: {
    success: {
      register: 'Notification webhook registration process completed successfully',
      sendNotification: 'Notification sent successfully'
    },
    error: {
      notFound: 'Notification record not found.',
      invalidUrl: 'Invalid URL'
    }
  },
  holderNotification: {
    success: {
      register: 'Notification registration process completed successfully',
      sendNotification: 'Notification sent successfully'
    },
    error: {
      notFound: 'Notification record not found.',
      conflict: 'Holder already registered for this session'
    }
  },
  storeObject: {
    success: {
      storeObject: 'Data stored successfully'
    }
  },
  geolocation: {
    success: {
      countriesVerificationCode: 'All countries has been fetched successfully',
      stateVerificationCode: 'All states has been fetched successfully',
      cityVerificationCode: 'All cities has been fetched successfully'
    },
    error: {
      stateNotFound: 'No states found for provided countryId.Please provide valid countryId',
      citiesNotFound: 'No cities found for provided stateId and countryId.Please provide valid stateId and countryId'
    }
  },
  cloudWallet: {
    success: {
      create: 'Cloud wallet created successfully',
      receive: 'Received invitation successfully',
      configureBaseWallet: 'Successfully configure the base wallet.',
      acceptProofRequest: 'Proof request has been successfully accepted.',
      createConnection: 'Connection created successfully.',
      basicMessage: 'Basic message send successfully',
      getProofById: 'Proof presentation has been successfully received.',
      getProofPresentation: 'Proof presentations has been successfully received.',
      didList: 'DID list fetched sucessfully',
      connectionById: 'Connection record fetched successfully',
      credentials: 'Credentials fetched successfully',
      credentialByRecordId: 'Credential fetched successfully',
      connectionList: 'Connection list fetched successfully',
      basicMessageByConnectionId: 'Basic message fetched successfully'
    },
    error: {
      baseWalletNotFound: 'Base wallet configuration not found',
      createCloudWallet: 'Error while creating cloud wallet on agent',
      encryptCloudWalletKey: 'Error while creating encrypting wallet key',
      userExist: 'Wallet already exist for the user',
      walletNotExist: 'Wallet not exist for the user',
      agentDetails: 'Invalid agent details',
      agentNotRunning: 'Agent is not up and running',
      receiveInvitation: 'Error while receiving invitation by url',
      AcceptOffer: 'Error while  invitation by url',
      notReachable: 'The agent endpoint is not reachable.',
      agentAlreadyExist: 'Agent already exist.',
      platformAdminRecordNotFound: 'Platform admin reocrd not exist.',
      notFoundBaseWallet: 'The base wallet record is missing.',
      walletRecordNotFound: 'Wallet record not found.'
    }
  },
  oidcIssuer: {
    success: {
      create: 'OID4VC issuer created successfully.',
      update: 'OID4VC issuer updated successfully.',
      delete: 'OID4VC issuer deleted successfully.',
      fetch: 'OID4VC issuer(s) fetched successfully.',
      issuerConfig: 'Issuer config details created successfully',
      issuerConfigUpdate: 'Issuer config details updated successfully'
    },
    error: {
      notFound: 'OID4VC issuer not found.',
      invalidId: 'Invalid OID4VC issuer ID.',
      createFailed: 'Failed to create OID4VC issuer.',
      updateFailed: 'Failed to update OID4VC issuer.',
      deleteFailed: 'Failed to delete OID4VC issuer.'
    }
  },
  oidcTemplate: {
    success: {
      create: 'OID4VC template created successfully.',
      update: 'OID4VC template updated successfully.',
      delete: 'OID4VC template deleted successfully.',
      fetch: 'OID4VC template(s) fetched successfully.',
      getById: 'OID4VC template details fetched successfully.',
      deleteTemplate: '[createTemplate] compensating delete succeeded for templateId=${templateId}'
    },
    error: {
      notFound: 'OID4VC template not found.',
      invalidId: 'Invalid OID4VC template ID.',
      createFailed: 'Failed to create OID4VC template.',
      updateFailed: 'Failed to update OID4VC template.',
      deleteFailed: 'Failed to delete OID4VC template.',
      issuerDisplayNotFound: 'Issuer display not found.',
      issuerDetailsNotFound: 'Issuer details not found.',
      templateNameAlreadyExist: 'Template name already exists for this issuer.',
      deleteTemplate: 'Error while deleting template.',
      failedDeleteTemplate: '[createTemplate] compensating delete FAILED for templateId='
    }
  },
  oidcIssuerSession: {
    success: {
      create: 'OID4VC Credential offer created successfully.',
      getById: 'OID4VC Credential offer details fetched successfully.',
      getAll: 'OID4VC Credential offers fetched successfully.',
      update: 'OID4VC Credential offer updated successfully.',
      delete: 'OID4VC Credential offer deleted successfully.'
    },
    error: {
      errorCreateOffer: 'Error while creating OID4VC credential offer on agent.',
      errorUpdateOffer: 'Error while updating OID4VC credential offer on agent.',
      deleteFailed: 'Failed to delete OID4VC credential offer.',
      missingValidityInfo: 'Validity Info(validFrom, validTo) is required for validity of credential'
    }
  },
  oid4vp: {
    success: {
      create: 'OID4VP verifier created successfully.',
      update: 'OID4VP verifier updated successfully.',
      delete: 'OID4VP verifier deleted successfully.',
      fetch: 'OID4VP verifier(s) fetched successfully.',
      getById: 'OID4VP verifier details fetched successfully.'
    },
    error: {
      notFound: 'OID4VP verifier not found.',
      invalidId: 'Invalid OID4VP verifier ID.',
      createFailed: 'Failed to create OID4VP verifier.',
      updateFailed: 'Failed to update OID4VP verifier.',
      deleteFailed: 'Failed to delete OID4VP verifier.',
      verifierIdAlreadyExists: 'Verifier ID already exists for this verifier.'
    }
  },
  oid4vpSession: {
    success: {
      create: 'OID4VP session verifier created successfully.',
      update: 'OID4VP session verifier updated successfully.',
      delete: 'OID4VP session verifier deleted successfully.',
      fetch: 'OID4VP session verifier(s) fetched successfully.',
      getById: 'OID4VP session verifier details fetched successfully.',
      webhookReceived: 'OID4VP presentation webhook stored successfully.'
    },
    error: {
      notFound: 'OID4VP session verifier not found.',
      invalidId: 'Invalid OID4VP session verifier ID.',
      createFailed: 'Failed to create OID4VP session verifier.',
      updateFailed: 'Failed to update OID4VP session verifier.',
      deleteFailed: 'Failed to delete OID4VP session verifier.',
      verifierIdAlreadyExists: 'Verifier ID already exists for this verifier.',
      deleteTemplate: 'Error while deleting template.',
      responseNotFound: 'Verification session response not found.'
    }
  },
  oid4vpIntentToTemplate: {
    success: {},
    error: {
      notFound: 'Intent to template mapping not found.',
      invalidId: 'Invalid id.'
    }
  },
  x509: {
    success: {
      create: 'x509 certificate created successfully',
      activated: 'x509 certificate activated successfully',
      deActivated: 'x509 certificate deactivated successfully',
      fetch: 'x509 certificate fetched successfully',
      fetchAll: 'x509 certificates fetched successfully',
      import: 'x509 certificate imported successfully'
    },
    error: {
      errorCreate: 'Error while creating x509 certificate.',
      errorUpdateStatus: 'Error while updating x509 certificate.',
      errorActivation: 'Failed to activate x509 certificate..',
      agentEndPointNotFound: 'Agent details not found',
      collision: 'Certificate date range collides with existing certificates for this organization',
      collisionForActivatingX5c:
        'Certificate date range collides with existing certificates for this organization, In order to active this you need to Inactivate the previous one.',
      notFound: 'x509 certificate record not found.',
      import: 'Failed to import x509 certificate',
      errorDecode: 'Error while decoding x509 certificate.'
    }
  },
  nats: {
    success: {},
    error: {
      noSubscribers:
        'No subscribers for the requested message. Error while connecting to NATS, service might not be started',
      natsConnect: 'Empty response. There are no subscribers listening to that message'
    }
  },
  common: {
    error: {
      invalidUrl: 'Please check the url suffix.',
      invalidEndpoint: 'Invalid agent endpoint provided',
      fetchBaseWalletToken: 'Error while fetching base wallet token',
      fetchTenantWalletToken: 'Error while fetching tenant wallet token'
    }
  }
};
