import type { Request } from 'express';
import type { SessionContainer } from 'supertokens-node/recipe/session';

export interface StRequest extends Request {
  session?: SessionContainer;
  superTokensUserId?: string;
}