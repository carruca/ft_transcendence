'use strict'
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from 'express'
import { AuthService } from "./auth.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    async use(req: Request, _res: Response, next: NextFunction) {
        try {
            if (req.user) {
                next()
            }
            const { auth_method: authMethod, token, refresh_token } = req.signedCookies
            const data = await new AuthService().getUser(authMethod, token, refresh_token)
            if (data) {
                req.user = data // User data is now available via req.user :)
                // TODO: Check if user is on our DataBase
                next();
            }
        } catch (error) {
            console.error(error)
        }
        // TODO: Manage errors
        next()
    }
}
