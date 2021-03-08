declare namespace hbs.AST {
  interface Expression {
    type: 'Expression';
    data: Record<string, any>;
    original: string;
  }
  interface Hash {
    default: string;
  }
  interface Program {
    type: 'Program';
  }
  interface Statement {
    type: 'Statement';
  }
}

declare module 'mini-css-extract-plugin';
declare module '@hapi/boom';
declare module 'ejs';
declare module 'lodash.merge';
declare module 'lodash.escape';
declare module 'koa-views';
declare module 'koa-busboy';
declare module 'koa-bodyparser';
declare module 'koa-webpack';
declare module 'dotenv';
declare module 'koa-csrf';
declare module 'koa-log';
declare module 'koa-helmet';
declare module 'koa-session';
declare module 'koa-convert';
declare module 'koa-better-flash';
declare module 'koa-mount';
declare module 'koa-static';