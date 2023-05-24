'use strict'
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

class NoNicknameError extends UnauthorizedException {
    constructor() {
        super('No nickname');
    }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private usersService: UsersService) { }

    checkUserNickname(req: Request, _res: Response, _next: NextFunction) {
        // if req.path is PUT /users/me, then we don't need to check the nickname
        if (req.originalUrl === '/users/me' && req.method === 'PUT') {
            return;
        }
        if (req.user.nickname === null) {
            throw new NoNicknameError();
        }
    }

    async use(req: Request, _res: Response, next: NextFunction) {
        try {
            if (req.user) {
                this.checkUserNickname(req, _res, next);
                return next();
            }
            const { auth_method: authMethod, token, refresh_token } = req.signedCookies;
            const data = await new AuthService().getUser(authMethod, token, refresh_token);
            if (data) {
                req.intraUser = data;
                let user = await this.usersService.findOneByIntraId(data.id);
                if (!user) {
                    user = await this.usersService.create(data);
                }
                req.user = user;
                this.checkUserNickname(req, _res, next);
                return next();
            }
        } catch (error) {
            this.checkUserNickname(req, _res, next);
            console.error(error)
        }
        throw new UnauthorizedException();
    }
}
