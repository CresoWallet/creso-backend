declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
// const issued_user_token = payload.issued_user_token;
// const publicAddress = payload.publicAddress;

// export interface jwtPayload {
//   payload: {
//     id: string;
//     issued_user_token: string;
//     publicAddress: string;
//   };
// }
export interface IAuthUser {
  id: string;
  username: string;
  email: string;
}
