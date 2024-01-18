
export const ResponseMessages = {
    user: {
        success: {
            create: 'User registered successfully',
            update: 'User details updated successfully',
            emaiVerified: 'Email verified successfully',
            login: 'User login successfully',
            fetchProfile: 'User fetched successfully',
            fetchInvitations: 'Org invitations fetched successfully',
            invitationReject: 'Organization invitation rejected',
            invitationAccept: 'Organization invitation accepted',
            fetchUsers: 'Users fetched successfully',
            newUser: 'User not found',
            checkEmail: 'User email checked successfully.',
            sendVerificationCode: 'Verification link has been successfully sent on the email. Please verify',
            userActivity: 'User activities fetched successfully',
            userCredentials: 'User credentials fetched successfully',
            platformEcosystemettings: 'Platform and ecosystem settings updated',
            fetchPlatformSettings: 'Platform settings fetched',
            signUpUser:'User created successfully',
            shareUserCertificate:'Certificate URL generated successfully',
            updateUserProfile:'User profile updated successfully'
        },
        error: {
            exists: 'User already exists',
            profileNotFound: 'User public profile not found',
            notUpdatePlatformSettings: 'Unable to update platform config settings',
            platformSetttingsNotFound: 'Unable to get platform settings',
            ecosystemSetttingsNotFound: 'Unable to get ecosystem settings',
            notUpdateEcosystemSettings: 'Unable to update ecosystem config settings',
            verificationAlreadySent: 'The verification link has already been sent to your email address',
            emailSend: 'Unable to send email to the user',
            invalidEmailUrl: 'Invalid verification code or EmailId!',
            verifiedEmail: 'Email already verified',
            notFound: 'User not found',
            verifyMail: 'Please verify your email',
            invalidCredentials: 'Invalid Credentials',
            registerFido: 'Please complete your fido registration',
            invitationNotFound: 'Invitation not found',
            invitationAlreadyAccepted:'Organization invitation already accepted',
            invitationAlreadyRejected:'Organization invitation already rejected',
            invalidInvitationStatus: 'Invalid invitation status',
            invalidKeycloakId: 'keycloakId is invalid',
            invalidEmail: 'Invalid Email Id!',
            adduser: 'Unable to add user details',
            verifyEmail: 'The verification link has already been sent to your email address. please verify',
            emailNotVerified: 'The verification link has already been sent to your email address. please verify',
            userNotRegisterd: 'The user has not yet completed the registration process',
            InvalidEmailDomain :'Email from this domain is not allowed',
            credentialNotFound: 'User credentials not found',
            invalidOrgId:'Organization does not exist',
            invalidInvitationId:'Organization invitation does not exist',
            invitationAlreadyPending:'Organization invitation is already in pending state',
            emailIsNotVerified:'Email is not verified',
            invitationStatusUpdateInvalid: 'Status update is invalid. Request is already'
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
            orgInvitationDeleted: 'Organization invitation deleted successfully'
        },
        error: {
            exists: 'An organization name is already exist',
            orgProfileNotFound: 'Organization public profile not found',
            orgSlugIsRequired: 'orgslug is required',
            invitationIdIsRequired:'Invitation Id is required',
            userIdIsRequired:'UserId is required',
            rolesNotExist: 'Provided roles not exists in the platform',
            orgProfile: 'Organization profile not found',
            userNotFound: 'User not found for the given organization',
            orgRoleIdNotFound:'Provided roles not exists in the platform',
            updateUserRoles: 'Unable to update user roles',
            deleteOrg: 'Organization not found',
            deleteOrgInvitation: 'Organization does not have access to delete this invitation',
            notFound: 'Organization agent not found',
            orgNotFound: 'Organization not found',
            orgNotMatch: 'Organization does not have access',
            invitationStatusInvalid: 'Unable to delete invitation with accepted/rejected status',
            invalidOrgId:'Invalid format for orgId',
            orgIdIsRequired:'OrgId is required',
            invalidUserId:'Invalid format of userId',
            invalidInvitationId:'Invalid format for invitaion id',
            ecosystemIdIsRequired:'ecosystemId is required'
            
        }
    },

    fido: {
        success: {
            RegistrationOption: 'Registration option created successfully',
            verifyRegistration: 'Verify registration sucessfully',
            updateUserDetails: 'User details updated successfully',
            generateAuthenticationOption: 'Authentication option generated successfully',
            deleteDevice: 'Device deleted sucessfully',
            updateDeviceName: 'Device name updated sucessfully',
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
            create: 'Schema created successfully.'
        },
        error: {
            invalidSchemaId: 'Invalid schema Id provided.',
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
            failedFetchSchema: 'Failed to fetch schema data'
        }
    },
    credentialDefinition: {
        success: {
            fetch: 'Credential definition fetched successfully.',
            create: 'Credential definition created successfully.'
        },
        error: {
            NotFound: 'No credential definitions found.',
            NotSaved: 'Error in saving credential definition.',
            Conflict: 'Credential definition already exists',
            schemaIdNotFound: 'SchemaLedgerId not found',
            OrgDidNotFound: 'OrgDid not found',
            credDefIdNotFound: 'Credential Definition Id not found'
        }
    },
    ledger: {
        success: {
            fetch: 'Ledgers retrieved successfully.'
        },
        error: {
            NotFound: 'No ledgers found.'
        }
    },
    agent: {
        success: {
            create: 'Agent process initiated successfully. Please wait',
            health: 'Agent health details retrieved successfully.',
            webhookUrlRegister:'Webhook Url registered successfully',
            getWebhookUrl:'Webhook Url fetched successfully'
        },
        error: {
            exists: 'An agent name is already exist',
            orgNotFound: 'Organization not found',
            apiEndpointNotFound: 'apiEndpoint not found',
            notAbleToSpinUpAgent: 'Agent not able to spin up',
            alreadySpinUp: 'Agent already spun up',
            agentUrl: 'Agent url not exist',
            apiKeyNotExist:'API key is not found',
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
            walletAlreadyCreated: 'Your wallet is already been created',
            walletAlreadyProcessing: 'Your wallet is already processing',
            notAbleToSpinp: 'Agent not able to spun up',
            platformAdminNotAbleToSpinp: 'Platform admin agent is not spun up',
            seedCharCount: 'seed must be at most 32 characters',
            nullTenantId:'TenantId must not be null',
            tenantIdNotFound:'TenantId not found',
            invalidTenantIdIdFormat:'Invalid tenantId format',
            requiredTenantId:'Tenant Id is required'
        }
    },
    connection: {
        success: {
            create: 'Connection created successfully',
            receivenvitation: 'Invitation received successfully',
            fetchConnection: 'Connection details fetched successfully',
            fetch: 'Connections details fetched successfully'
        },
        error: {
            exists: 'Connection is already exist',
            connectionNotFound: 'Connection not found',
            agentEndPointNotFound: 'agentEndPoint Not Found',
            agentUrlNotFound: 'agent url not found'
        }
    },
    issuance: {
        success: {
            create: 'Credentials offer created successfully',
            fetch: 'Issued Credentials details fetched successfully',
            importCSV: 'File imported sucessfully',
            previewCSV: 'File details fetched sucessfully',
            bulkIssuance: 'Issuance process started. It will take some time',
            notFound: 'Schema records not found'
        },
        error: {
            exists: 'Credentials is already exist',
            credentialsNotFound: 'Credentials not found',
            agentEndPointNotFound: 'agent end point Not Found',
            organizationNotFound: 'organization Not Found',
            agentUrlNotFound: 'agent url not found',
            notFound: 'History not found',
            credentialOfferNotFound: 'Credential offer not found',
            invitationNotFound: 'Invitation not found',
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
            attributesNotPresent: 'Attributes are not present or not empty'
        }
    },
    verification: {
        success: {
            fetch: 'Proof presentations details fetched successfully.',
            create: 'Presentation of proof received successfully.',
            verifiedProofDetails: 'Proof presentation details fetched successfully.',
            send: 'Proof request send successfully.',
            verified: 'Proof presentation verified successfully.'
        },
        error: {
            notFound: 'Organization agent not found',
            agentUrlNotFound: 'agent url not found',
            schemaIdNotFound: 'Schema Id is required',
            predicatesValueNotNumber: 'The attribuite value is not a number',
            proofPresentationNotFound: 'Proof presentations not found',
            verifiedProofNotFound: 'Proof presentation not found',
            proofNotFound: 'Proof presentation not found',
            invitationNotFound: 'Invitation not found',
            platformConfigNotFound: 'Platform config not found',
            emailSend: 'Unable to send email to the user'
        }
    },
    ecosystem: {
        success: {
            create: 'Ecosystem created successfully',
            update: 'Ecosystem details updated successfully',
            delete: 'Ecosystem invitations deleted successfully',
            fetch: 'Ecosystem fetched successfully',
            getEcosystemDashboard: 'Ecosystem dashboard details fetched successfully',
            getInvitation: 'Ecosystem invitations fetched successfully',
            createInvitation: 'Ecosystem invitations sent',
            schemaRequest: 'Schema transaction request created successfully',
            credDefRequest: 'credential-definition transaction request created successfully',
            sign: 'Transaction request signed successfully',
            submit: 'Transaction request submitted successfully',
            invitationReject: 'Ecosystem invitation rejected',
            invitationAccept: 'Ecosystem invitation accepted successfully',
            fetchEndorsors: 'Endorser transactions fetched successfully',
            DeclineEndorsementTransaction: 'Decline endorsement request successfully',
            AutoEndorsementTransaction: 'The flag for transactions has been successfully set',
            fetchMembers: 'Ecosystem members fetched successfully',
            allschema: 'Schema details fetched sucessfully'
        },
        error: {
            notCreated: 'Error while creating ecosystem',
            orgNotExist: 'Organization does not exist',
            orgDidNotExist: 'Organization did does not exist',
            exists: 'An ecosystem name is already exist',
            update: 'Error while updating ecosystem',
            invalidInvitationStatus: 'Invalid invitation status',
            invitationNotFound: 'Ecosystem Invitation not found',
            invitationNotUpdate: 'Ecosystem Invitation not updated',
            ledgerNotMatch: 'Organization ledger network not matched with Ecosystem',
            orgsNotUpdate: 'Ecosystem Orgs not updated',
            ecosystemNotEnabled: 'Ecosystem service is not enabled',
            sumbitTransaction: 'Error while submitting transaction',
            requestSchemaTransaction: 'Error while request schema transaction',
            requestCredDefTransaction: 'Error while submitting transaction',
            notFound: 'Organization not found',
            platformConfigNotFound: 'Platform configurations not found',
            schemaNotFound: 'Schema not found',
            ecosystemNotFound: 'Ecosystem not found',
            ecosystemOrgNotFound: 'Ecosystem org not found',
            ecosystemConfigNotFound: 'Ecosystem config not found',
            credentialDefinitionNotFound: 'Credential definition found',
            leadNotFound: 'Lead details not found',
            signRequestError: 'Error while signing the transaction',
            updateTransactionError: 'Error while update the transaction',
            schemaAlreadyExist: 'Schema name and schema version already exist',
            credDefAlreadyExist: 'Credential definition already exist',
            saveSchema: 'Error while storing the schema details',
            saveCredDef: 'Error while storing the credential-definition details',
            invalidOrgId: 'Invalid organization Id',
            invalidEcosystemId: 'Invalid ecosystem Id',
            invalidTransaction: 'Transaction does not exist',
            transactionSubmitted: 'Transaction already submitted',
            invalidAgentUrl: 'Invalid agent url',
            EndorsementTransactionNotFoundException: 'Endorsement transaction with status requested not found',
            OrgOrEcosystemNotFoundExceptionForEndorsementTransaction: 'The endorsement transaction status cant be updated',
            ecosystemOrgAlready: 'Organization is already part of the ecosystem. Please ensure that the organization is not duplicated.',
            updateSchemaId: 'Error while updating the schema id',
            updateCredDefId: 'Error while updating the credential-definition',
            invalidMessage: 'Invalid transaction details. Missing "message" property.',
            invalidTransactionMessage: 'Invalid transaction details'
        }
    },
    bulkIssuance: {
        success: {
            create: 'Issuance process successfully'
        },
        error: {
            PathNotFound: 'Path to export data not found.',
            emailColumn: '1st column of the file should always be email.',
            attributeNumber: 'Number of supplied values is different from the number of schema attributes.',
            mismatchedAttributes: 'Schema attributes are mismatched in the file header.',
            fileDetailsNotFound: 'File details not found.'
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
            webhookUrlRegister:'Webhook Url registered successfully',
            getWebhookUrl:'Webhook Url fetched successfully'
        },
        error: {
            registerWebhook:'Unable to register a webhook url',
            webhookResponse:'Error in sending webhook response to org webhook url'
        }
    }
};