'use strict'
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RateLimitedFetchService } from '../rate-limited/rate-limited-fetch.service';

class NoNicknameError extends UnauthorizedException {
    constructor() {
        super('No nickname');
    }
}

class No2FAError extends UnauthorizedException {
    constructor() {
        super('No 2FA token passed');
    }
}

class userDisabledError extends UnauthorizedException {
    constructor() {
        super('User disabled');
    }
}

class userBannedError extends UnauthorizedException {
    constructor() {
        super('User banned');
    }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor (private usersService: UsersService,
                 private readonly jwtService: JwtService,
                 private readonly rateLimitedFetchService: RateLimitedFetchService) { }

    checkUserNickname(req: Request, _res: Response, _next: NextFunction) {
        // if req.path is PUT /users/me, then we don't need to check the nickname
        if (req.originalUrl === '/users/me' && req.method === 'PUT') {
            return;
        }
        if (req.originalUrl.startsWith('/users/nickname/') && req.method === 'GET') {
            return;
        }
        if (req.originalUrl === '/users/me/2fa' && req.method === 'POST') {
            return;
        }
        if (req.user.nickname === null) {
            throw new NoNicknameError();
        }
    }
    
    async check2FA(req: Request, res: Response, _next: NextFunction) {
        if (req.originalUrl === '/users/me/2fa' && req.method === 'POST') {
            return;
        }
        const _2fa_secret = await this.usersService.get2FASecret(req.user.id);
        const { _2fa } = req.signedCookies;
        if (!_2fa_secret) {
            return;
        }
        if (!_2fa) {
            throw new No2FAError();
        }
        try {
            const payload = this.jwtService.verify(_2fa);
            if (payload.id !== req.user.id) {
                throw new No2FAError();
            }
        } catch (error) {
            throw new No2FAError();
        }
    }

    async use(req: Request, _res: Response, next: NextFunction) {
        try {
            if (req.user) {
                this.checkUserNickname(req, _res, next);
                return next();
            }
            const { auth_method: authMethod, token, refresh_token } = req.signedCookies;
            const data = await new AuthService(this.rateLimitedFetchService).getUser(authMethod, token, refresh_token);
            if (data) {
                req.intraUser = data;
                let user = await this.usersService.findOneByIntraId(data.id);
                if (!user) {
                    user = await this.usersService.create(data);
                }
                req.user = user;
                if (await this.usersService.isDisabled(user.id)) {
                    throw new userDisabledError();
                }
                if (await this.usersService.isBanned(user.id)) {
                    throw new userBannedError();
                }
                this.checkUserNickname(req, _res, next);
                await this.check2FA(req, _res, next);
                return next();
            }
        } catch (error) {
            if (await this.usersService.isDisabled(req.user.id)) {
                throw new userDisabledError();
            }
            if (await this.usersService.isBanned(req.user.id)) {
                throw new userBannedError();
            }
            this.checkUserNickname(req, _res, next);
            await this.check2FA(req, _res, next);
            console.error(error)
        }
        throw new UnauthorizedException();
    }
}
