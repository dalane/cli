// https://stackoverflow.com/questions/37355244/ignore-cannot-find-module-error-on-typescript

declare module "eckles" {

  interface Eckles {
    import:Function;
    export:Function;
    generate:Function;
    thumbprint:Function;
  }

  const eckles:Eckles;

  export = eckles;

}
