
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
            sendVerificationCode: 'Verification code has been sent sucessfully to the mail. Please verify',
            userActivity: 'User activities fetched successfully'
        },
        error: {
            exists: 'User already exists',
            profileNotFound: 'User public profile not found',
            verificationAlreadySent: 'The verification link has already been sent to your email address',
            emailSend: 'Unable to send email to the user',
            invalidEmailUrl: 'Invalid verification code or EmailId!',
            verifiedEmail: 'Email already verified',
            notFound: 'User not found',
            verifyMail: 'Please verify your email',
            invalidCredentials: 'Invalid Credentials',
            registerFido: 'Please complete your fido registration',
            invitationNotFound: 'Invitation not found',
            invalidInvitationStatus: 'Invalid invitation status',
            invalidKeycloakId: 'keycloakId is invalid',
            invalidEmail: 'Invalid Email Id!',
            adduser: 'Unable to add user details',
            verifyEmail: 'The verification link has already been sent to your email address. please verify',
            emailNotVerified: 'The verification link has already been sent to your email address. please verify',
            userNotRegisterd: 'The user has not yet completed the registration process'
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
            updateUserRoles: 'User roles updated successfully'
        },
        error: {
            exists: 'An organization name is already exist',
            profileNotFound: 'Organization public profile not found',
            rolesNotExist: 'Provided roles not exists in the platform',
            orgProfile: 'Organization profile not found',
            userNotFound: 'User not found for the given organization',
            updateUserRoles: 'Unable to update user roles'
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
            invalidVersion: 'Invalid schema version provided.',
            insufficientAttributes: 'Please provide at least one attribute.',
            invalidAttributes: 'Please provide unique attributes',
            emptyData: 'Please provide data for creating schema.',
            exists: 'Schema already exists',
            notCreated: 'Schema not created',
            notFound: 'Schema records not found',
            schemaIdNotFound: 'SchemaLedgerId not found',
            credentialDefinitionNotFound: 'No credential definition exist'
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
            create: 'Agent spin-up successfully',
            health: 'Agent health details retrieved successfully.'
        },
        error: {
            exists: 'An agent name is already exist',
            orgNotFound: 'Organization not found',
            apiEndpointNotFound: 'apiEndpoint not found',
            notAbleToSpinUpAgent: 'Agent not able to spin-up',
            alreadySpinUp: 'Agent already spin-up',
            agentUrl: 'Agent url not exist',
            agentNotExists: 'Agent not spinned up for this organization'
        }
    },
    connection: {
        success: {
            create: 'Connection created successfully',
            fetch: 'Connection fetched successfully'
        },
        error: {
            exists: 'Connection is already exist',
            connectionNotFound: 'ConnectionNotFound not found',
            agentEndPointNotFound: 'agentEndPoint Not Found',
            agentUrlNotFound: 'agent url not found'
        }
    },
    issuance: {
        success: {
            create: 'Issue-credential offer created successfully',
            fetch: 'Issue-credential fetched successfully'

        },
        error: {
            exists: 'Credentials is already exist',
            credentialsNotFound: 'Credentials not found',
            agentEndPointNotFound: 'agentEndPoint Not Found',
            organizationNotFound: 'organization Not Found',
            agentUrlNotFound: 'agent url not found',
            notFound: 'Organization agent not found',
            credentialOfferNotFound: "Credential offer not found",
            invitationNotFound: "Invitation not found",
            platformConfigNotFound: "Platform config details not found",
            emailSend: 'Unable to send email to the user',
        }
    },
    verification: {
        success: {
            fetch: 'Proof presentation received successfully.',
            proofFormData: 'Proof presentation form data received successfully.',
            send: 'Proof request send successfully.',
            verified: 'Proof presentation verified successfully.'
        },
        error: {
            notFound: 'Organization agent not found',
            agentUrlNotFound: 'agent url not found',
            schemaIdNotFound: 'Schema Id is required',
            predicatesValueNotNumber: 'The attribuite value is not a number',
            proofPresentationNotFound: 'Proof presentation not found',
            invitationNotFound: 'Invitation not found',
            platformConfigNotFound: 'Platform config not found',
            emailSend: 'Unable to send email to the user'
        }
    },
    ecosystem: {
        success: {
            create: 'Ecosystem created successfully',
            update: 'Ecosystem updated successfully',
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
            fetchMembers: 'Ecosystem members fetched successfully'
        },
        error: {
            notCreated: 'Error while creating ecosystem',
            update: 'Error while updating ecosystem',
            invalidInvitationStatus: 'Invalid invitation status',
            invitationNotFound: 'Ecosystem Invitation not found',
            invitationNotUpdate: 'Ecosystem Invitation not updated',
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
            ecosystemOrgAlready: 'Organization is already part of the ecosystem. Please ensure that the organization is not duplicated.'
        }
    }
};