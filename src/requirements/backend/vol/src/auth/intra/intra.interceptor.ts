'use strict'
import { IntraService } from './intra.service'
  
export const IntraToken = (): MethodDecorator => {

    return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value

        descriptor.value = async function (token: string, refresh_token: string) {
            try {
                return await originalMethod.call(this, token, refresh_token)
            } catch (error) {
                if (error.status === 401) {
                    const intraService = new IntraService((this as Record<string, any> | undefined)?.rateLimitedFetchService)
                    const newToken = await intraService.refreshToken(refresh_token)
                    const response = await originalMethod.call(this, newToken, refresh_token);
                    return response
                }
                throw error
            }
        }
        return descriptor
    }
}
