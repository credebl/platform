import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {

    private readonly logger = new Logger(SupabaseService.name);
    private clientInstance: SupabaseClient;
    constructor(
        @Inject(REQUEST) private readonly request: Request
    ) { }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getClient(): SupabaseClient<any, "public", any> {
        this.logger.log('getting supabase client...');

        if (this.clientInstance) {
            this.logger.log('client exists - returning for current Scope.REQUEST');
            return this.clientInstance;
        }

        this.logger.log('initialising new supabase client for new Scope.REQUEST');

        this.clientInstance = createClient(
          
            process.env.SUPABASE_URL,
            process.env.SUPABASE_KEY
            // {
            //     auth: {
            //         persistSession: false
            //     },
            //     global: {
            //         headers: {
            //             Authorization: `Bearer ${ExtractJwt.fromAuthHeaderAsBearerToken()(
            //                 this.request
            //             )}`
            //         }
            //     }
            // }
        );

        this.logger.log('auth has been set!');

        return this.clientInstance;
    }
}
