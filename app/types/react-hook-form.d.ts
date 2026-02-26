declare module "react-hook-form" {
  export function useForm<T extends Record<string, any> = Record<string, any>>(
    props?: any,
  ): any;
  export const zodResolver: any;
}
